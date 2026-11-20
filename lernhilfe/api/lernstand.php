<?php
// Kinder und Lernstand der Lernhilfe in MySQL/MariaDB
//
// GET  lernstand.php?action=kinder            -> {"kinder":[{id,name,color,ts}]}
// GET  lernstand.php?action=get&id=<id>       -> {"kind":{id,name,color,ts,data}}
// POST lernstand.php?action=add   {id?,name,color}  -> {"kind":{...}}  (gleicher Name = bestehendes Kind)
// POST lernstand.php?action=save  {id,base,data}    -> {"ok":true,"ts":n} oder 409 mit aktuellem Stand
// POST lernstand.php?action=delete {id}             -> {"ok":true}
//
// Bewusst ohne Passwort: Anmeldung nur mit dem Namen.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_FLAGS);
    exit;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) fail(503, 'config.php fehlt auf dem Server');
    $config = require $file;
    $c = $config['db'] ?? [];
    $dsn = "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4";
    if (!empty($c['port'])) $dsn .= ";port={$c['port']}";
    $pdo = new PDO($dsn, $c['user'], $c['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS lernhilfe_kinder (
            id VARCHAR(40) NOT NULL PRIMARY KEY,
            name VARCHAR(60) NOT NULL,
            color VARCHAR(16) NOT NULL,
            ts BIGINT UNSIGNED NOT NULL DEFAULT 0,
            data MEDIUMTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    return $pdo;
}

function body(): array
{
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if ($raw === false || strlen($raw) > MAX_BODY_BYTES) fail(413, 'Anfrage zu groß');
    $b = json_decode($raw, true);
    if (!is_array($b)) fail(400, 'Ungültige Anfrage');
    return $b;
}

function validId(mixed $id): string
{
    $id = (string)$id;
    if (!preg_match('/^[a-z0-9_-]{1,40}$/i', $id)) fail(400, 'Ungültige id');
    return $id;
}

function kindOut(array $r, bool $withData): array
{
    $k = ['id' => $r['id'], 'name' => $r['name'], 'color' => $r['color'], 'ts' => (int)$r['ts']];
    if ($withData) {
        $d = json_decode($r['data'], true);
        $k['data'] = is_array($d) && $d ? $d : new stdClass();
    }
    return $k;
}

function findKind(string $id): ?array
{
    $s = db()->prepare('SELECT * FROM lernhilfe_kinder WHERE id = ?');
    $s->execute([$id]);
    return $s->fetch() ?: null;
}

try {
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($action === 'kinder' && $method === 'GET') {
        $rows = db()->query('SELECT id, name, color, ts FROM lernhilfe_kinder ORDER BY created_at')->fetchAll();
        echo json_encode(['kinder' => array_map(fn ($r) => kindOut($r, false), $rows)], JSON_FLAGS);
    } elseif ($action === 'get' && $method === 'GET') {
        $r = findKind(validId($_GET['id'] ?? ''));
        if (!$r) fail(404, 'Kind nicht gefunden');
        echo json_encode(['kind' => kindOut($r, true)], JSON_FLAGS);
    } elseif ($action === 'add' && $method === 'POST') {
        $b = body();
        $name = trim(preg_replace('/\s+/u', ' ', (string)($b['name'] ?? '')));
        $name = mb_substr($name, 0, 30);
        if ($name === '') fail(400, 'Name fehlt');
        $s = db()->prepare('SELECT * FROM lernhilfe_kinder WHERE LOWER(name) = LOWER(?)');
        $s->execute([$name]);
        $r = $s->fetch();
        if (!$r) {
            $id = isset($b['id']) && $b['id'] !== '' ? validId($b['id']) : 'k' . bin2hex(random_bytes(6));
            $color = preg_match('/^#[0-9a-f]{6}$/i', (string)($b['color'] ?? '')) ? $b['color'] : '#1c7ed6';
            db()->prepare('INSERT INTO lernhilfe_kinder (id, name, color, ts, data) VALUES (?, ?, ?, 0, ?)')
                ->execute([$id, $name, $color, '{}']);
            $r = findKind($id);
        }
        echo json_encode(['kind' => kindOut($r, true)], JSON_FLAGS);
    } elseif ($action === 'save' && $method === 'POST') {
        $b = body();
        $id = validId($b['id'] ?? '');
        $base = (int)($b['base'] ?? -1);
        if (!is_array($b['data'] ?? null)) fail(400, 'data fehlt');
        $data = json_encode($b['data'], JSON_FLAGS);
        // ts ist ein Versionszähler: gespeichert wird nur, wenn das Gerät auf dem
        // aktuellen Stand aufgebaut hat. Sonst 409, das Gerät führt dann zusammen.
        $s = db()->prepare('UPDATE lernhilfe_kinder SET data = ?, ts = ts + 1 WHERE id = ? AND ts = ?');
        $s->execute([$data, $id, $base]);
        $r = findKind($id);
        if (!$r) fail(404, 'Kind nicht gefunden');
        if ($s->rowCount() === 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Neuerer Stand vorhanden', 'kind' => kindOut($r, true)], JSON_FLAGS);
            exit;
        }
        echo json_encode(['ok' => true, 'ts' => (int)$r['ts']], JSON_FLAGS);
    } elseif ($action === 'delete' && $method === 'POST') {
        $b = body();
        db()->prepare('DELETE FROM lernhilfe_kinder WHERE id = ?')->execute([validId($b['id'] ?? '')]);
        echo json_encode(['ok' => true], JSON_FLAGS);
    } else {
        fail(404, 'Unbekannte Aktion');
    }
} catch (PDOException $e) {
    error_log('Lernhilfe DB-Fehler: ' . $e->getMessage());
    fail(500, 'Datenbankfehler');
}
