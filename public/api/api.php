<?php
// Speicher für den Familienplaner: genau ein JSON-Dokument in MySQL/MariaDB.
//
// GET  api.php?since=<rev>   -> {"rev":n,"data":{...}} oder {"rev":n,"unchanged":true}
// POST api.php  {"ops":[{"path":"a.b","value":...}]}
//                           -> wendet die Änderungen atomar an, liefert {"rev","data"}
//
// Ein Pfad zeigt mit Punkten in das Dokument (wie bei Firestore). value null
// löscht das Feld. Set/Löschen sind idempotent, ein wiederholt gesendeter
// Schreibvorgang (z. B. nach Verbindungsabbruch) richtet also keinen Schaden an.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION;
const MAX_BODY_BYTES = 1048576;

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_FLAGS);
    exit;
}

function connect(): PDO
{
    $config = require __DIR__ . '/config.php';
    $dsn = "mysql:host={$config['host']};dbname={$config['name']};charset=utf8mb4";
    if (!empty($config['port'])) $dsn .= ";port={$config['port']}";
    $pdo = new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS familienplaner (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            rev INT UNSIGNED NOT NULL,
            data LONGTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $pdo->exec("INSERT IGNORE INTO familienplaner (id, rev, data) VALUES (1, 0, '{}')");
    return $pdo;
}

// Objekte bleiben stdClass statt assoziativer Arrays, sonst würde ein leeres
// Objekt {} beim Zurückschreiben zu einer leeren Liste [].
function applyOp(stdClass $doc, array $segments, mixed $value): void
{
    $node = $doc;
    $last = array_pop($segments);
    foreach ($segments as $key) {
        if (!isset($node->{$key}) || !($node->{$key} instanceof stdClass)) {
            if ($value === null) return; // zu löschendes Feld existiert ohnehin nicht
            $node->{$key} = new stdClass();
        }
        $node = $node->{$key};
    }
    if ($value === null) {
        unset($node->{$last});
    } else {
        $node->{$last} = $value;
    }
}

function parseOps(): array
{
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if ($raw === false || strlen($raw) > MAX_BODY_BYTES) fail(413, 'Anfrage zu groß');
    $body = json_decode($raw);
    if (!($body instanceof stdClass) || !isset($body->ops) || !is_array($body->ops)) {
        fail(400, 'ops fehlt');
    }
    $ops = [];
    foreach ($body->ops as $op) {
        if (!($op instanceof stdClass) || !isset($op->path) || !is_string($op->path)) {
            fail(400, 'Ungültige Operation');
        }
        $segments = explode('.', $op->path);
        if (strlen($op->path) > 300 || in_array('', $segments, true)) fail(400, 'Ungültiger Pfad');
        $ops[] = [$segments, property_exists($op, 'value') ? $op->value : null];
    }
    return $ops;
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $pdo = connect();
        $row = $pdo->query('SELECT rev, data FROM familienplaner WHERE id = 1')->fetch();
        $rev = (int) $row['rev'];
        if (isset($_GET['since']) && (int) $_GET['since'] === $rev) {
            echo json_encode(['rev' => $rev, 'unchanged' => true], JSON_FLAGS);
        } else {
            echo '{"rev":' . $rev . ',"data":' . $row['data'] . '}';
        }
        exit;
    }

    if ($method === 'POST') {
        $ops = parseOps();
        $pdo = connect();
        $pdo->beginTransaction();
        $row = $pdo->query('SELECT rev, data FROM familienplaner WHERE id = 1 FOR UPDATE')->fetch();
        $doc = json_decode($row['data']);
        if (!($doc instanceof stdClass)) $doc = new stdClass();
        foreach ($ops as [$segments, $value]) applyOp($doc, $segments, $value);
        $data = json_encode($doc, JSON_FLAGS);
        $rev = (int) $row['rev'] + 1;
        $stmt = $pdo->prepare('UPDATE familienplaner SET rev = ?, data = ? WHERE id = 1');
        $stmt->execute([$rev, $data]);
        $pdo->commit();
        echo '{"rev":' . $rev . ',"data":' . $data . '}';
        exit;
    }

    header('Allow: GET, POST');
    fail(405, 'Methode nicht erlaubt');
} catch (Throwable $e) {
    error_log('familienplaner api: ' . $e->getMessage());
    fail(500, 'Serverfehler');
}
