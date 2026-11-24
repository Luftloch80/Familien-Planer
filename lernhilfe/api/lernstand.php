<?php
// Anmeldung, Lernstand und Benutzerverwaltung der Lernhilfe
//
// Anmeldung (ohne Token):
//   GET  ?action=namen                                  -> {"namen":[{name,color,admin}]}  (Profil-Auswahl)
//   POST ?action=status  {name}                         -> {"neu":bool,"admin":bool}  (neu = noch kein Passwort)
//   POST ?action=login   {name,passwort,code?}          -> {"token","kind":{...,data}}
//        Beim ersten Anmelden legt das Kind sein Passwort mit "passwort" fest.
//        Für einen Admin ohne Passwort ist dabei zusätzlich der Zugangscode nötig.
// Mit Token (Header X-Lernhilfe-Token):
//   POST ?action=logout
//   POST ?action=passwort {alt,neu}                     -> eigenes Passwort ändern
//   POST ?action=bild     {bild}                        -> eigenes Profilbild (emoji:… / data-URL / null)
//   GET  ?action=get                                    -> {"kind":{...,data}}
//   POST ?action=save   {base,data}                     -> {"ok":true,"ts":n} oder 409 mit aktuellem Stand
// Nur Admin:
//   GET  ?action=users                                  -> {"users":[...]}
//   POST ?action=user_add    {name,rolle}
//   POST ?action=user_update {id,name?,rolle?,bild?,material?,reset_passwort?,reset_stand?}
//   POST ?action=user_delete {id}

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/common.php';

const COLORS = ['#e8590c', '#1c7ed6', '#2b8a3e', '#d6336c', '#7048e8', '#0c8599', '#f08c00', '#c2255c'];
const MIN_PASSWORT = 4;

function kindOut(array $r, bool $withData): array
{
    $k = ['id' => $r['id'], 'name' => $r['name'], 'color' => $r['color'], 'rolle' => $r['rolle'], 'bild' => $r['bild'] ?? null, 'material' => sharesUploads($r), 'ts' => (int)$r['ts']];
    if ($withData) {
        $d = json_decode($r['data'], true);
        $k['data'] = is_array($d) && $d ? $d : new stdClass();
    }
    return $k;
}

function findById(string $id): ?array
{
    $s = db()->prepare('SELECT * FROM lernhilfe_kinder WHERE id = ?');
    $s->execute([$id]);
    return $s->fetch() ?: null;
}

function findByName(string $name): ?array
{
    $s = db()->prepare('SELECT * FROM lernhilfe_kinder WHERE LOWER(name) = LOWER(?)');
    $s->execute([trim($name)]);
    return $s->fetch() ?: null;
}

function cleanName(mixed $name): string
{
    $name = trim((string)preg_replace('/\s+/u', ' ', (string)$name));
    $name = mb_substr($name, 0, 30);
    if ($name === '') fail(400, 'Name fehlt');
    return $name;
}

function checkPasswort(string $p): void
{
    if (mb_strlen($p) < MIN_PASSWORT) fail(400, 'Das Passwort muss mindestens ' . MIN_PASSWORT . ' Zeichen haben.');
    if (mb_strlen($p) > 200) fail(400, 'Das Passwort ist zu lang.');
}

// Profilbild: "emoji:🦊", ein kleines Foto als data-URL, oder null (Anfangsbuchstabe)
function cleanBild(mixed $b): ?string
{
    if ($b === null || $b === '') return null;
    $b = (string)$b;
    if (str_starts_with($b, 'emoji:')) {
        if (mb_strlen($b) > 20) fail(400, 'Ungültiges Bild');
        return $b;
    }
    if (preg_match('#^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$#', $b)) {
        if (strlen($b) > 400000) fail(413, 'Das Bild ist zu groß.');
        return $b;
    }
    fail(400, 'Ungültiges Bild');
}

function adminCount(): int
{
    return (int)db()->query("SELECT COUNT(*) FROM lernhilfe_kinder WHERE rolle = 'admin'")->fetchColumn();
}

// kurze Zusammenfassung des Lernstands für die Admin-Seite
function summary(string $json): array
{
    $d = json_decode($json, true) ?: [];
    $vok = 0;
    foreach (($d['vocab'] ?? []) as $v) if ((int)$v >= 2) $vok++;
    $ex = 0;
    foreach (($d['ex'] ?? []) as $e) if (is_array($e) && ($e['total'] ?? 0) > 0 && ($e['best'] ?? 0) >= $e['total']) $ex++;
    return ['vokabeln' => $vok, 'uebungen' => $ex];
}

try {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch ("$method $action") {
        case 'GET namen': {
            // nur Namen und Farben für die Profil-Auswahl auf der Startseite
            $rows = db()->query("SELECT id, name, color, rolle, bild FROM lernhilfe_kinder ORDER BY rolle = 'admin', name")->fetchAll();
            echo json_encode(['namen' => array_map(fn ($r) => ['name' => $r['name'], 'color' => $r['color'], 'bild' => $r['bild'], 'admin' => $r['rolle'] === 'admin'], $rows)], JSON_FLAGS);
            break;
        }
        case 'POST status': {
            $b = readBody();
            $r = findByName((string)($b['name'] ?? ''));
            if (!$r) fail(404, 'Diesen Namen gibt es nicht. Frag deine Eltern, ob du schon angelegt bist.');
            echo json_encode(['name' => $r['name'], 'neu' => $r['pass_hash'] === null, 'admin' => $r['rolle'] === 'admin'], JSON_FLAGS);
            break;
        }
        case 'POST login': {
            $b = readBody();
            $r = findByName((string)($b['name'] ?? ''));
            $pass = (string)($b['passwort'] ?? '');
            if (!$r) { usleep(300000); fail(401, 'Name oder Passwort stimmt nicht.'); }
            if ($r['pass_hash'] === null) {
                // erstes Anmelden: Passwort festlegen
                checkPasswort($pass);
                if ($r['rolle'] === 'admin') {
                    $code = (string)(config()['code'] ?? '');
                    if ($code === '' || !hash_equals($code, (string)($b['code'] ?? ''))) fail(403, 'Der Zugangscode stimmt nicht.');
                }
                $s = db()->prepare('UPDATE lernhilfe_kinder SET pass_hash = ? WHERE id = ? AND pass_hash IS NULL');
                $s->execute([password_hash($pass, PASSWORD_DEFAULT), $r['id']]);
                if ($s->rowCount() === 0) fail(409, 'Das Passwort wurde gerade schon festgelegt. Bitte anmelden.');
            } elseif (!password_verify($pass, $r['pass_hash'])) {
                usleep(300000);
                fail(401, 'Name oder Passwort stimmt nicht.');
            }
            $token = newSession($r['id']);
            echo json_encode(['token' => $token, 'kind' => kindOut(findById($r['id']), true)], JSON_FLAGS);
            break;
        }
        case 'POST logout': {
            $t = bearerToken();
            if ($t !== '') db()->prepare('DELETE FROM lernhilfe_sessions WHERE token_hash = ?')->execute([hash('sha256', $t)]);
            echo json_encode(['ok' => true], JSON_FLAGS);
            break;
        }
        case 'POST passwort': {
            $u = requireUser();
            $b = readBody();
            if (!password_verify((string)($b['alt'] ?? ''), (string)$u['pass_hash'])) fail(403, 'Das alte Passwort stimmt nicht.');
            $neu = (string)($b['neu'] ?? '');
            checkPasswort($neu);
            db()->prepare('UPDATE lernhilfe_kinder SET pass_hash = ? WHERE id = ?')->execute([password_hash($neu, PASSWORD_DEFAULT), $u['id']]);
            echo json_encode(['ok' => true], JSON_FLAGS);
            break;
        }
        case 'POST bild': {
            $u = requireUser();
            $b = readBody();
            db()->prepare('UPDATE lernhilfe_kinder SET bild = ? WHERE id = ?')->execute([cleanBild($b['bild'] ?? null), $u['id']]);
            echo json_encode(['ok' => true], JSON_FLAGS);
            break;
        }
        case 'GET get': {
            $u = requireUser();
            echo json_encode(['kind' => kindOut($u, true)], JSON_FLAGS);
            break;
        }
        case 'POST save': {
            $u = requireUser();
            $b = readBody();
            if (!is_array($b['data'] ?? null)) fail(400, 'data fehlt');
            // ts ist ein Versionszähler: gespeichert wird nur, wenn das Gerät auf dem
            // aktuellen Stand aufgebaut hat. Sonst 409, das Gerät führt dann zusammen.
            $s = db()->prepare('UPDATE lernhilfe_kinder SET data = ?, ts = ts + 1 WHERE id = ? AND ts = ?');
            $s->execute([json_encode($b['data'], JSON_FLAGS), $u['id'], (int)($b['base'] ?? -1)]);
            $r = findById($u['id']);
            if ($s->rowCount() === 0) {
                http_response_code(409);
                echo json_encode(['error' => 'Neuerer Stand vorhanden', 'kind' => kindOut($r, true)], JSON_FLAGS);
                break;
            }
            echo json_encode(['ok' => true, 'ts' => (int)$r['ts']], JSON_FLAGS);
            break;
        }
        case 'GET users': {
            requireAdmin();
            $rows = db()->query('SELECT k.*, (SELECT MAX(last_used) FROM lernhilfe_sessions s WHERE s.kind_id = k.id) AS zuletzt FROM lernhilfe_kinder k ORDER BY k.rolle, k.name')->fetchAll();
            echo json_encode(['users' => array_map(fn ($r) => kindOut($r, false) + [
                'hat_passwort' => $r['pass_hash'] !== null,
                'zuletzt' => $r['zuletzt'],
                'stand' => summary($r['data']),
            ], $rows)], JSON_FLAGS);
            break;
        }
        case 'POST user_add': {
            requireAdmin();
            $b = readBody();
            $name = cleanName($b['name'] ?? '');
            if (findByName($name)) fail(409, 'Diesen Namen gibt es schon.');
            $rolle = ($b['rolle'] ?? '') === 'admin' ? 'admin' : 'kind';
            $n = (int)db()->query('SELECT COUNT(*) FROM lernhilfe_kinder')->fetchColumn();
            db()->prepare('INSERT INTO lernhilfe_kinder (id, name, color, ts, data, rolle) VALUES (?, ?, ?, 0, ?, ?)')
                ->execute(['k' . bin2hex(random_bytes(6)), $name, COLORS[$n % count(COLORS)], '{}', $rolle]);
            echo json_encode(['ok' => true], JSON_FLAGS);
            break;
        }
        case 'POST user_update': {
            $me = requireAdmin();
            $b = readBody();
            $r = findById((string)($b['id'] ?? ''));
            if (!$r) fail(404, 'Nutzer nicht gefunden');
            if (isset($b['name'])) {
                $name = cleanName($b['name']);
                $other = findByName($name);
                if ($other && $other['id'] !== $r['id']) fail(409, 'Diesen Namen gibt es schon.');
                db()->prepare('UPDATE lernhilfe_kinder SET name = ? WHERE id = ?')->execute([$name, $r['id']]);
            }
            if (isset($b['rolle'])) {
                $rolle = $b['rolle'] === 'admin' ? 'admin' : 'kind';
                if ($rolle === 'kind' && $r['rolle'] === 'admin' && adminCount() <= 1) fail(409, 'Es muss mindestens einen Admin geben.');
                db()->prepare('UPDATE lernhilfe_kinder SET rolle = ? WHERE id = ?')->execute([$rolle, $r['id']]);
            }
            if (isset($b['material'])) {
                db()->prepare('UPDATE lernhilfe_kinder SET teilt = ? WHERE id = ?')->execute([$b['material'] ? 1 : 0, $r['id']]);
            }
            if (array_key_exists('bild', $b)) {
                db()->prepare('UPDATE lernhilfe_kinder SET bild = ? WHERE id = ?')->execute([cleanBild($b['bild']), $r['id']]);
            }
            if (!empty($b['reset_passwort'])) {
                // Passwort zurücksetzen: beim nächsten Anmelden wird ein neues festgelegt
                db()->prepare('UPDATE lernhilfe_kinder SET pass_hash = NULL WHERE id = ?')->execute([$r['id']]);
                db()->prepare('DELETE FROM lernhilfe_sessions WHERE kind_id = ?')->execute([$r['id']]);
            }
            if (!empty($b['reset_stand'])) {
                db()->prepare('UPDATE lernhilfe_kinder SET data = ?, ts = ts + 1 WHERE id = ?')
                    ->execute([json_encode(['_reset' => (int)(microtime(true) * 1000)]), $r['id']]);
            }
            echo json_encode(['ok' => true, 'selbst' => $r['id'] === $me['id']], JSON_FLAGS);
            break;
        }
        case 'POST user_delete': {
            $me = requireAdmin();
            $b = readBody();
            $r = findById((string)($b['id'] ?? ''));
            if (!$r) fail(404, 'Nutzer nicht gefunden');
            if ($r['id'] === $me['id']) fail(409, 'Du kannst dich nicht selbst löschen.');
            if ($r['rolle'] === 'admin' && adminCount() <= 1) fail(409, 'Es muss mindestens einen Admin geben.');
            db()->prepare('DELETE FROM lernhilfe_sessions WHERE kind_id = ?')->execute([$r['id']]);
            db()->prepare('DELETE FROM lernhilfe_kinder WHERE id = ?')->execute([$r['id']]);
            echo json_encode(['ok' => true], JSON_FLAGS);
            break;
        }
        default:
            fail(404, 'Unbekannte Aktion');
    }
} catch (PDOException $e) {
    error_log('Lernhilfe DB-Fehler: ' . $e->getMessage());
    fail(500, 'Datenbankfehler');
}
