<?php
// Schnittstelle der Lernhilfe
//
// GET  api.php?action=list                -> {"themen":[...]}   alle gespeicherten Themen
// POST api.php?action=analyze  {"images":[{"type":"image/jpeg","data":"<base64>"}]}
//                                          -> Fotos auswerten: Fach + Thema erkennen,
//                                             Lerninhalte erzeugen, als neues Thema
//                                             speichern oder an ein bestehendes anhängen
// POST api.php?action=update   {"id":123,"epoche":"…"} -> Epoche/Titel ändern
// POST api.php?action=delete   {"id":123}  -> Thema löschen
//
// analyze, update und delete verlangen den Zugangscode im Header X-Lernhilfe-Code,
// sofern in config.php einer gesetzt ist.

declare(strict_types=1);

if (!is_file(__DIR__ . '/vendor/autoload.php')) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo '{"error":"Fotoerkennung ist nicht eingerichtet"}';
    exit;
}
require __DIR__ . '/vendor/autoload.php';

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Lib\Streaming\MessageAccumulator;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const MAX_IMAGES = 8;
const MODEL = 'claude-opus-5-5';

const FAECHER = [
    'mathe' => 'Mathe',
    'englisch' => 'Englisch',
    'franz' => 'Französisch',
    'deutsch' => 'Deutsch',
    'latein' => 'Latein',
    'spanisch' => 'Spanisch',
    'bio' => 'Biologie',
    'physik' => 'Physik',
    'chemie' => 'Chemie',
    'geschichte' => 'Geschichte',
    'erdkunde' => 'Erdkunde',
    'musik' => 'Musik',
    'religion' => 'Religion/Ethik',
    'sonstiges' => 'Sonstiges',
];

// Themen, die fest in der Webseite stehen (aus den ersten Lernheften)
const BASIS_THEMEN = [
    ['id' => 'mathe-basis', 'fach' => 'mathe', 'epoche' => 'Flächen und Körper', 'titel' => 'Fläche, Volumen, Oberfläche, Einheiten',
        'zusammenfassung' => 'Rechteck, Quadrat, Dreieck (A = g·h:2), zusammengesetzte Flächen, Quader und Würfel (Volumen, Oberfläche), Einheiten umrechnen (Länge, Fläche, Volumen, Ar/Hektar, Liter).'],
    ['id' => 'englisch-basis', 'fach' => 'englisch', 'epoche' => '', 'titel' => 'Around the World in 80 Days – Kapitel 2',
        'zusammenfassung' => 'Vokabeln zu Kapitel 2 „Phileas Fogg makes a bet“ (wealthy, robbery, thief, receipt, reward, bet …), Simple Present, Adverbs, If-Clauses Typ 2.'],
    ['id' => 'franz-basis', 'fach' => 'franz', 'epoche' => '', 'titel' => 'Vocabulaire Chapitre 1–3 · Le passé récent',
        'zusammenfassung' => 'Vokabeln Chapitre 1 (Ende), Chapitre 2 „Voisins et amis“, Chapitre 3 „Les étrangers“; Grammatik passé récent (venir de + Infinitiv) und Abgrenzung zum futur proche.'],
];

// Eingebaute Themen plus die Themen aus js/data-themen.js (im Repo gepflegt)
function basisThemen(): array
{
    static $list = null;
    if ($list !== null) return $list;
    $list = BASIS_THEMEN;
    $file = __DIR__ . '/../js/data-themen.js';
    if (is_file($file)) {
        $js = (string)file_get_contents($file);
        $start = strpos($js, 'window.LERN.themen =');
        if ($start !== false) {
            $json = trim(substr($js, $start + strlen('window.LERN.themen =')));
            $json = rtrim($json, "; \n\r\t");
            $themen = json_decode($json, true);
            foreach (is_array($themen) ? $themen : [] as $t) {
                $d = $t['data'] ?? [];
                $list[] = [
                    'id' => 'repo-' . ($t['id'] ?? ''),
                    'fach' => $t['fach'] ?? 'sonstiges',
                    'epoche' => $d['epoche'] ?? '',
                    'titel' => $t['titel'] ?? '',
                    'zusammenfassung' => $d['zusammenfassung'] ?? '',
                    'vokabeln' => array_slice(array_map(fn ($v) => $v['begriff'] ?? '', $d['vokabeln'] ?? []), 0, 150),
                ];
            }
        }
    }
    return $list;
}

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_FLAGS);
    exit;
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/config.php';
        if (!is_file($file)) fail(500, 'config.php fehlt auf dem Server');
        $config = require $file;
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = config()['db'];
    $dsn = "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4";
    if (!empty($c['port'])) $dsn .= ";port={$c['port']}";
    $pdo = new PDO($dsn, $c['user'], $c['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS lernhilfe_themen (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            fach VARCHAR(32) NOT NULL,
            basis VARCHAR(32) NULL,
            titel VARCHAR(255) NOT NULL,
            data LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    return $pdo;
}

function requireCode(): void
{
    $code = (string)(config()['code'] ?? '');
    if ($code === '') return;
    $given = (string)($_SERVER['HTTP_X_LERNHILFE_CODE'] ?? '');
    if (!hash_equals($code, $given)) fail(401, 'Zugangscode fehlt oder ist falsch');
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if ($raw === false || strlen($raw) > MAX_BODY_BYTES) fail(413, 'Anfrage zu groß');
    $body = json_decode($raw, true);
    if (!is_array($body)) fail(400, 'Ungültige Anfrage');
    return $body;
}

function loadThemen(): array
{
    $rows = db()->query('SELECT id, fach, basis, titel, data, updated_at FROM lernhilfe_themen ORDER BY updated_at DESC')->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int)$r['id'];
        $r['data'] = json_decode($r['data'], true) ?: [];
    }
    return $rows;
}

// ---------- Auswertung der Fotos ----------

function schema(): array
{
    $str = ['type' => 'string'];
    $strList = ['type' => 'array', 'items' => $str];
    $obj = fn (array $props) => [
        'type' => 'object',
        'properties' => $props,
        'required' => array_keys($props),
        'additionalProperties' => false,
    ];
    return $obj([
        'ist_lernmaterial' => ['type' => 'boolean', 'description' => 'false, wenn die Fotos kein Schul-/Lernmaterial zeigen oder unlesbar sind'],
        'fach' => ['type' => 'string', 'enum' => array_keys(FAECHER)],
        'thema_id' => ['type' => 'string', 'description' => 'id des passenden bestehenden Themas aus der Liste, oder leerer String bei neuem Thema'],
        'begruendung' => ['type' => 'string', 'description' => 'Ein kurzer Satz für das Kind: woran Fach und Thema erkannt wurden und warum neu bzw. Ergänzung'],
        'titel' => ['type' => 'string', 'description' => 'Kurzer Titel des Themas (bei Ergänzung: Titel des neuen Abschnitts)'],
        'epoche' => ['type' => 'string', 'description' => 'Name der Epoche (Waldorfschule), z. B. "Geometrie", "Mittelalter", "Pflanzenkunde". Bei Ergänzung die Epoche des bestehenden Themas. Leer bei Fächern ohne Epochenunterricht (meist Fremdsprachen).'],
        'zusammenfassung' => ['type' => 'string', 'description' => 'Ein bis zwei Sätze, worum es geht (für spätere Zuordnung)'],
        'sprache' => ['type' => 'string', 'enum' => ['', 'en', 'fr', 'es', 'la', 'de'], 'description' => 'Sprache der Vokabeln (Fremdsprache), sonst leer'],
        'vokabeln' => ['type' => 'array', 'items' => $obj([
            'begriff' => ['type' => 'string', 'description' => 'Wort/Ausdruck in der Fremdsprache bzw. Fachbegriff'],
            'bedeutung' => ['type' => 'string', 'description' => 'Deutsche Bedeutung bzw. Erklärung'],
            'erklaerung' => ['type' => 'string', 'description' => 'Optional: einsprachige Erklärung oder Beispielsatz, sonst leer'],
        ])],
        'stolperfallen' => $strList,
        'grammatik' => ['type' => 'array', 'items' => $obj([
            'titel' => $str,
            'inhalt' => ['type' => 'string', 'description' => 'Erklärung in einfachem Markdown: Absätze, **fett**, *kursiv*, Listen mit "- ", Tabellen mit | und Kopfzeile, Überschriften mit ###'],
        ])],
        'uebungen' => ['type' => 'array', 'items' => $obj([
            'titel' => $str,
            'anleitung' => $str,
            'aufgaben' => ['type' => 'array', 'items' => $obj([
                'frage' => ['type' => 'string', 'description' => 'Aufgabentext; jede Lücke als ___ (drei Unterstriche)'],
                'hinweis' => ['type' => 'string', 'description' => 'z. B. Grundform des Verbs, sonst leer'],
                'luecken' => ['type' => 'array', 'items' => $obj([
                    'loesungen' => ['type' => 'array', 'items' => $str, 'description' => 'Alle richtigen Antworten für diese Lücke, die erste ist die Musterlösung. Bei Mathe nur die Zahl.'],
                    'einheit' => ['type' => 'string', 'description' => 'Einheit hinter der Lücke bei Zahlenergebnissen (z. B. cm²), sonst leer'],
                ])],
                'erklaerung' => ['type' => 'string', 'description' => 'Kurzer Lösungsweg oder Begründung, sonst leer'],
            ])],
        ])],
    ]);
}

function systemPrompt(): string
{
    return <<<TXT
Du bist eine Lernhilfe für ein Schulkind (etwa Klasse 5–8) in Deutschland. Du bekommst Fotos von Schulmaterial: Arbeitsblätter, Buchseiten, Hefteinträge, Vokabellisten, Tafelbilder.

Deine Aufgaben:
1. Erkenne das Schulfach. Das Kind geht auf eine Waldorfschule: Hauptfächer werden in Epochen (mehrwöchigen Blöcken) unterrichtet. Ordne das Thema einer Epoche zu; nutze dafür, wenn passend, eine Epoche, die bei den bestehenden Themen desselben Fachs schon vorkommt, sonst einen kurzen, üblichen Epochennamen.
2. Entscheide, ob die Fotos zu einem der bestehenden Themen gehören (Liste in der Nachricht). Gehört es zum selben Kapitel, derselben Lektion oder derselben Grammatik wie ein bestehendes Thema, gib dessen id als thema_id an. Ist es ein anderes Kapitel oder ein anderes Stoffgebiet, ist es ein neues Thema: thema_id leer.
3. Erstelle daraus Lernmaterial auf Deutsch, das dem Kind beim Üben hilft:
   - vokabeln: alle Vokabeln oder Fachbegriffe, die auf den Fotos stehen, genau wie dort geschrieben (mit Accents, Artikeln, "to" bei englischen Verben). Bei Mathe meist leer.
   - grammatik: die Regeln, Formeln und Merksätze von den Fotos, kindgerecht erklärt, mit Beispielen. Bei Mathe: Formeln und Rechenwege.
   - stolperfallen: typische Fehler zu diesem Stoff.
   - uebungen: übernimm die Aufgaben von den Fotos und löse sie; ergänze passende eigene Übungen, sodass jede Regel und die wichtigsten Vokabeln geübt werden. Jede Lücke wird mit ___ markiert und hat in luecken genau einen Eintrag, in derselben Reihenfolge. Die Anzahl der ___ in frage muss gleich der Anzahl der luecken sein. Lösungen müssen eindeutig prüfbar sein: kurze Lücken statt freier Texte; gib erlaubte Varianten mit an. Bei Rechenaufgaben steht in loesungen nur die Zahl (Dezimalkomma wie in Deutschland ist erlaubt) und die Einheit in einheit.
4. Gehört es zu einem bestehenden Thema, erzeuge nur das, was auf diesen Fotos neu ist, und wiederhole keine Vokabeln aus der Liste.

Erfinde keine Inhalte, die nicht zum Stoff auf den Fotos passen. Was auf den Fotos nicht lesbar ist, lässt du weg. Zeigen die Fotos kein Lernmaterial, setze ist_lernmaterial auf false und lass die Listen leer.
TXT;
}

function analyze(): void
{
    requireCode();
    $body = readJsonBody();
    $images = $body['images'] ?? null;
    if (!is_array($images) || !$images) fail(400, 'Keine Fotos');
    if (count($images) > MAX_IMAGES) fail(400, 'Höchstens ' . MAX_IMAGES . ' Fotos auf einmal');

    $content = [];
    foreach ($images as $i => $img) {
        $type = $img['type'] ?? '';
        $data = $img['data'] ?? '';
        if (!in_array($type, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true) || !is_string($data) || $data === '') {
            fail(400, 'Foto ' . ($i + 1) . ' ist ungültig');
        }
        $content[] = ['type' => 'text', 'text' => 'Foto ' . ($i + 1) . ':'];
        $content[] = ['type' => 'image', 'source' => ['type' => 'base64', 'mediaType' => $type, 'data' => $data]];
    }

    // Bekannte Themen als Kandidaten für die Zuordnung
    $themen = loadThemen();
    $known = [];
    foreach (basisThemen() as $b) $known[] = $b;
    foreach ($themen as $t) {
        $d = $t['data'];
        $known[] = [
            'id' => (string)$t['id'],
            'fach' => $t['fach'],
            'titel' => $t['titel'],
            'epoche' => $d['epoche'] ?? '',
            'zusammenfassung' => $d['zusammenfassung'] ?? '',
            'ergaenzt_basis' => $t['basis'] ?? '',
            'vokabeln' => array_slice(array_map(fn ($v) => $v['begriff'], $d['vokabeln'] ?? []), 0, 150),
        ];
    }
    $content[] = ['type' => 'text', 'text' => "Bestehende Themen:\n" . json_encode($known, JSON_FLAGS | JSON_PRETTY_PRINT)];

    $apiKey = (string)(config()['anthropic_key'] ?? '');
    if ($apiKey === '') fail(500, 'Kein API-Schlüssel auf dem Server hinterlegt');

    @set_time_limit(300);
    ignore_user_abort(true);

    $client = new Client(apiKey: $apiKey, baseUrl: config()['base_url'] ?? null);
    try {
        $stream = $client->beta->messages->createStream(
            model: MODEL,
            maxTokens: 32000,
            system: systemPrompt(),
            messages: [['role' => 'user', 'content' => $content]],
            outputConfig: ['effort' => 'medium', 'format' => ['type' => 'json_schema', 'schema' => schema()]],
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
        );
        $acc = MessageAccumulator::forBetaMessages();
        foreach ($stream as $event) $acc->accumulate($event);
        $message = $acc->message();
    } catch (APIStatusException $e) {
        error_log('Lernhilfe Claude-Fehler: ' . $e->getMessage());
        $status = $e->status ?? 0;
        if ($status === 429 || $status === 529) fail(503, 'Die Erkennung ist gerade ausgelastet. Bitte gleich nochmal versuchen.');
        fail(502, 'Die Erkennung hat nicht geklappt (' . $status . ').');
    } catch (Throwable $e) {
        error_log('Lernhilfe Fehler: ' . $e->getMessage());
        fail(502, 'Die Erkennung hat nicht geklappt. Bitte nochmal versuchen.');
    }

    if ($message->stopReason === 'refusal') fail(422, 'Diese Fotos konnten nicht ausgewertet werden.');
    if ($message->stopReason === 'max_tokens') fail(422, 'Zu viel Stoff auf einmal – bitte weniger Fotos pro Auswertung.');

    $text = null;
    foreach ($message->content as $block) {
        if ($block->type === 'text') $text = $block->text; // der letzte Textblock ist die Antwort
    }
    $result = $text !== null ? json_decode($text, true) : null;
    if (!is_array($result)) fail(502, 'Die Antwort der Erkennung war unvollständig. Bitte nochmal versuchen.');

    if (empty($result['ist_lernmaterial'])) {
        echo json_encode(['ok' => false, 'begruendung' => $result['begruendung'] ?: 'Auf den Fotos wurde kein Lernmaterial erkannt.'], JSON_FLAGS);
        return;
    }

    $result = cleanResult($result);
    echo json_encode(saveResult($result, $themen, count($images)), JSON_FLAGS);
}

// Lücken und ___ in Einklang bringen, leere Einträge entfernen
function cleanResult(array $r): array
{
    $r['vokabeln'] = array_values(array_filter($r['vokabeln'] ?? [], fn ($v) => trim($v['begriff'] ?? '') !== '' && trim($v['bedeutung'] ?? '') !== ''));
    $r['grammatik'] = array_values(array_filter($r['grammatik'] ?? [], fn ($g) => trim($g['inhalt'] ?? '') !== ''));
    $r['stolperfallen'] = array_values(array_filter(array_map('trim', $r['stolperfallen'] ?? [])));
    $uebungen = [];
    foreach ($r['uebungen'] ?? [] as $u) {
        $aufgaben = [];
        foreach ($u['aufgaben'] ?? [] as $a) {
            $luecken = array_values(array_filter($a['luecken'] ?? [], fn ($l) => !empty(array_filter($l['loesungen'] ?? [], fn ($s) => trim($s) !== ''))));
            if (!$luecken) continue;
            $frage = (string)($a['frage'] ?? '');
            $n = substr_count($frage, '___');
            if ($n < count($luecken)) {
                $frage .= str_repeat(' ___', count($luecken) - $n);
            } elseif ($n > count($luecken)) {
                $parts = explode('___', $frage);
                $frage = '';
                foreach ($parts as $k => $p) {
                    $frage .= $p;
                    if ($k < count($parts) - 1) $frage .= $k < count($luecken) ? '___' : '…';
                }
            }
            $a['frage'] = preg_replace('/_{4,}/', '___', $frage);
            $a['luecken'] = $luecken;
            $aufgaben[] = $a;
        }
        if ($aufgaben) {
            $u['aufgaben'] = $aufgaben;
            $uebungen[] = $u;
        }
    }
    $r['uebungen'] = $uebungen;
    return $r;
}

function saveResult(array $r, array $themen, int $fotos): array
{
    $fach = array_key_exists($r['fach'], FAECHER) ? $r['fach'] : 'sonstiges';
    $id = trim((string)$r['thema_id']);
    $basisIds = array_column(basisThemen(), 'id');
    $now = date('c');

    $target = null;
    $basis = null;
    if ($id !== '' && in_array($id, $basisIds, true)) {
        // Ergänzung zu einem fest eingebauten Thema: in einem eigenen Datensatz sammeln
        $basis = $id;
        foreach ($themen as $t) if (($t['basis'] ?? '') === $id) { $target = $t; break; }
    } elseif ($id !== '') {
        foreach ($themen as $t) if ((string)$t['id'] === $id) { $target = $t; break; }
    }
    $neu = $id === '';

    $neuerTeil = [
        'vokabeln' => $r['vokabeln'],
        'grammatik' => $r['grammatik'],
        'stolperfallen' => $r['stolperfallen'],
        'uebungen' => array_map(fn ($u) => $u + ['datum' => $now], $r['uebungen']),
    ];

    if ($target) {
        $d = $target['data'];
        $seen = [];
        foreach ($d['vokabeln'] ?? [] as $v) $seen[mb_strtolower(trim($v['begriff']))] = true;
        foreach ($neuerTeil['vokabeln'] as $v) {
            $k = mb_strtolower(trim($v['begriff']));
            if (!isset($seen[$k])) { $d['vokabeln'][] = $v; $seen[$k] = true; }
        }
        $d['grammatik'] = array_merge($d['grammatik'] ?? [], $neuerTeil['grammatik']);
        $d['stolperfallen'] = array_values(array_unique(array_merge($d['stolperfallen'] ?? [], $neuerTeil['stolperfallen'])));
        $d['uebungen'] = array_merge($d['uebungen'] ?? [], $neuerTeil['uebungen']);
        $d['verlauf'][] = ['datum' => $now, 'fotos' => $fotos, 'titel' => $r['titel']];
        if (trim((string)($d['epoche'] ?? '')) === '') $d['epoche'] = trim((string)($r['epoche'] ?? ''));
        $stmt = db()->prepare('UPDATE lernhilfe_themen SET data = ? WHERE id = ?');
        $stmt->execute([json_encode($d, JSON_FLAGS), $target['id']]);
        $themaId = $target['id'];
        $titel = $target['titel'];
    } else {
        $basisTitel = '';
        $basisFach = $fach;
        foreach (basisThemen() as $b) if ($b['id'] === $basis) { $basisTitel = $b['titel']; $basisFach = $b['fach']; }
        $titel = $basis ? 'Ergänzung: ' . $basisTitel : ($r['titel'] ?: 'Neues Thema');
        if ($basis) $fach = $basisFach;
        $d = $neuerTeil + [
            'zusammenfassung' => $r['zusammenfassung'],
            'epoche' => $basis ? (string)(array_column(basisThemen(), 'epoche', 'id')[$basis] ?? '') : trim((string)($r['epoche'] ?? '')),
            'sprache' => $r['sprache'] ?? '',
            'verlauf' => [['datum' => $now, 'fotos' => $fotos, 'titel' => $r['titel']]],
        ];
        $stmt = db()->prepare('INSERT INTO lernhilfe_themen (fach, basis, titel, data) VALUES (?, ?, ?, ?)');
        $stmt->execute([$fach, $basis, mb_substr($titel, 0, 255), json_encode($d, JSON_FLAGS)]);
        $themaId = (int)db()->lastInsertId();
    }

    return [
        'ok' => true,
        'neu' => $neu,
        'fach' => $fach,
        'fach_name' => FAECHER[$fach],
        'basis' => $basis,
        'thema_id' => $themaId,
        'titel' => $titel,
        'abschnitt' => $r['titel'],
        'begruendung' => $r['begruendung'],
        'anzahl' => [
            'vokabeln' => count($r['vokabeln']),
            'grammatik' => count($r['grammatik']),
            'uebungen' => count($r['uebungen']),
        ],
        'themen' => loadThemen(),
    ];
}

// Epoche (oder Titel) eines Themas von Hand ändern
function updateThema(): void
{
    requireCode();
    $body = readJsonBody();
    $id = (int)($body['id'] ?? 0);
    if ($id <= 0) fail(400, 'id fehlt');
    $stmt = db()->prepare('SELECT data, titel FROM lernhilfe_themen WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) fail(404, 'Thema nicht gefunden');
    $d = json_decode($row['data'], true) ?: [];
    $titel = $row['titel'];
    if (array_key_exists('epoche', $body)) $d['epoche'] = mb_substr(trim((string)$body['epoche']), 0, 100);
    if (isset($body['titel']) && trim((string)$body['titel']) !== '') $titel = mb_substr(trim((string)$body['titel']), 0, 255);
    db()->prepare('UPDATE lernhilfe_themen SET data = ?, titel = ? WHERE id = ?')->execute([json_encode($d, JSON_FLAGS), $titel, $id]);
    echo json_encode(['ok' => true, 'themen' => loadThemen()], JSON_FLAGS);
}

function deleteThema(): void
{
    requireCode();
    $body = readJsonBody();
    $id = (int)($body['id'] ?? 0);
    if ($id <= 0) fail(400, 'id fehlt');
    db()->prepare('DELETE FROM lernhilfe_themen WHERE id = ?')->execute([$id]);
    echo json_encode(['ok' => true, 'themen' => loadThemen()], JSON_FLAGS);
}

try {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($action === 'list' && $method === 'GET') {
        echo json_encode(['themen' => loadThemen(), 'code' => (string)(config()['code'] ?? '') !== ''], JSON_FLAGS);
    } elseif ($action === 'analyze' && $method === 'POST') {
        analyze();
    } elseif ($action === 'update' && $method === 'POST') {
        updateThema();
    } elseif ($action === 'delete' && $method === 'POST') {
        deleteThema();
    } else {
        fail(404, 'Unbekannte Aktion');
    }
} catch (PDOException $e) {
    error_log('Lernhilfe DB-Fehler: ' . $e->getMessage());
    fail(500, 'Datenbankfehler');
}
