<?php
// Wird beim Deployment aus den GitHub-Secrets erzeugt (siehe deploy-lernhilfe.yml).
return [
    'db' => ['host' => 'rdbms.strato.de', 'port' => '', 'name' => 'DB…', 'user' => 'U…', 'password' => '…'],
    'anthropic_key' => 'sk-ant-…',
    'code' => '', // optionaler Zugangscode für Fotos auswerten / Themen löschen
];
