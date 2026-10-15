<?php
// Vorlage für public/api/config.php. Beim Deployment schreibt GitHub Actions die echte
// config.php aus den Secrets STRATO_DB_*. Für lokale Tests kopieren und ausfüllen.
return [
    'host' => 'rdbms.strato.de',
    'port' => '',
    'name' => 'DB1234567',
    'user' => 'U1234567',
    'password' => '',
];
