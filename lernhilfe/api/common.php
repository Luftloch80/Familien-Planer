<?php
// Gemeinsame Teile der Lernhilfe-Schnittstellen: Konfiguration, Datenbank, Anmeldung

declare(strict_types=1);

const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
const SESSION_DAYS = 180;

function fail(int $status, string $message, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(['error' => $message] + $extra, JSON_FLAGS);
    exit;
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/config.php';
        if (!is_file($file)) fail(503, 'config.php fehlt auf dem Server');
        $config = require $file;
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = config()['db'] ?? [];
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
    // Spalten für die Anmeldung (ältere Tabellen werden ergänzt)
    $cols = array_column($pdo->query('SHOW COLUMNS FROM lernhilfe_kinder')->fetchAll(), 'Field');
    if (!in_array('pass_hash', $cols, true)) $pdo->exec('ALTER TABLE lernhilfe_kinder ADD pass_hash VARCHAR(255) NULL');
    if (!in_array('rolle', $cols, true)) $pdo->exec("ALTER TABLE lernhilfe_kinder ADD rolle VARCHAR(10) NOT NULL DEFAULT 'kind'");
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS lernhilfe_sessions (
            token_hash CHAR(64) NOT NULL PRIMARY KEY,
            kind_id VARCHAR(40) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (kind_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS lernhilfe_themen (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            fach VARCHAR(32) NOT NULL,
            basis VARCHAR(80) NULL,
            titel VARCHAR(255) NOT NULL,
            data LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    foreach ($pdo->query('SHOW COLUMNS FROM lernhilfe_themen')->fetchAll() as $col) {
        if ($col['Field'] === 'basis' && $col['Type'] !== 'varchar(80)') $pdo->exec('ALTER TABLE lernhilfe_themen MODIFY basis VARCHAR(80) NULL');
    }
    // Gibt es noch keinen Admin, wird "Admin" angelegt. Sein erstes Passwort
    // kann nur mit dem Zugangscode (Secret LERNHILFE_CODE) festgelegt werden.
    $admins = (int)$pdo->query("SELECT COUNT(*) FROM lernhilfe_kinder WHERE rolle = 'admin'")->fetchColumn();
    if ($admins === 0) {
        $s = $pdo->prepare("SELECT id FROM lernhilfe_kinder WHERE LOWER(name) = 'admin'");
        $s->execute();
        $id = $s->fetchColumn();
        if ($id) {
            $pdo->prepare("UPDATE lernhilfe_kinder SET rolle = 'admin' WHERE id = ?")->execute([$id]);
        } else {
            $pdo->prepare("INSERT INTO lernhilfe_kinder (id, name, color, ts, data, rolle) VALUES ('admin', 'Admin', '#495057', 0, '{}', 'admin')")->execute();
        }
    }
    return $pdo;
}

function readBody(int $max = 2097152): array
{
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if ($raw === false || strlen($raw) > $max) fail(413, 'Anfrage zu groß');
    $b = json_decode($raw, true);
    if (!is_array($b)) fail(400, 'Ungültige Anfrage');
    return $b;
}

// ---------- Anmeldung ----------

function newSession(string $kindId): string
{
    $token = bin2hex(random_bytes(32));
    db()->prepare('INSERT INTO lernhilfe_sessions (token_hash, kind_id) VALUES (?, ?)')
        ->execute([hash('sha256', $token), $kindId]);
    // alte Sitzungen aufräumen
    db()->prepare('DELETE FROM lernhilfe_sessions WHERE last_used < (NOW() - INTERVAL ' . SESSION_DAYS . ' DAY)')->execute();
    return $token;
}

function bearerToken(): string
{
    return (string)($_SERVER['HTTP_X_LERNHILFE_TOKEN'] ?? '');
}

// Angemeldeter Nutzer oder null
function currentUser(): ?array
{
    static $user = false;
    if ($user !== false) return $user;
    $user = null;
    $token = bearerToken();
    if ($token === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) return null;
    $hash = hash('sha256', $token);
    $s = db()->prepare('SELECT k.* FROM lernhilfe_sessions s JOIN lernhilfe_kinder k ON k.id = s.kind_id WHERE s.token_hash = ?');
    $s->execute([$hash]);
    $row = $s->fetch();
    if ($row) {
        $user = $row;
        db()->prepare('UPDATE lernhilfe_sessions SET last_used = NOW() WHERE token_hash = ?')->execute([$hash]);
    }
    return $user;
}

function requireUser(): array
{
    $u = currentUser();
    if (!$u) fail(401, 'Bitte neu anmelden', ['abgemeldet' => true]);
    return $u;
}

function requireAdmin(): array
{
    $u = requireUser();
    if ($u['rolle'] !== 'admin') fail(403, 'Nur für Admins');
    return $u;
}

// Angemeldet oder alter Zugangscode (für die Fotoerkennung)
function requireUserOrCode(): void
{
    if (currentUser()) return;
    $code = (string)(config()['code'] ?? '');
    $given = (string)($_SERVER['HTTP_X_LERNHILFE_CODE'] ?? '');
    if ($code !== '' && $given !== '' && hash_equals($code, $given)) return;
    fail(401, 'Bitte anmelden', ['abgemeldet' => currentUser() === null && bearerToken() !== '']);
}
