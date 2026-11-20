# Deployment (Strato-Subdomain)

Die App ist eine Vite-App mit einer kleinen PHP-Schnittstelle (`public/api/api.php`),
die die Daten als ein JSON-Dokument in einer MySQL/MariaDB-Datenbank bei Strato
speichert. Bei jedem Push auf `main` baut GitHub Actions
(`.github/workflows/deploy-strato.yml`) die App und lädt den Inhalt von `dist/`
per SFTP auf das Strato-Webhosting. Manuell starten geht über
GitHub → Actions → "Deploy auf Strato" → "Run workflow".

## 1. Subdomain bei Strato anlegen

1. Im Strato-Kundenlogin → Domains → Domainverwaltung → Subdomain anlegen,
   z. B. `planer.deine-domain.de`.
2. Bei der Subdomain unter "Einstellungen" als Ziel ein **Verzeichnis** im
   Webspace wählen, z. B. `/familien-planer`.
3. SSL für die Subdomain aktivieren (Strato → Sicherheit → SSL), sonst gibt es
   kein HTTPS.

## 2. Datenbank anlegen

Strato → Datenbanken und Webspace → Datenbankverwaltung → neue Datenbank anlegen
(MySQL oder MariaDB, egal). Strato zeigt danach Server, Datenbankname, Benutzer
und Passwort an. Die Tabelle legt `api.php` beim ersten Aufruf selbst an.

## 3. SFTP-Zugang

Strato → Hosting → Zugänge (SFTP). Server ist in der Regel `ssh.strato.de`,
Benutzername ist die Hauptdomain oder ein eigener SFTP-Benutzer.

## 4. GitHub-Secrets eintragen

GitHub → Repo → Settings → Secrets and variables → Actions → "New repository secret":

| Secret | Wert |
| --- | --- |
| `STRATO_SFTP_HOST` | `ssh.strato.de` |
| `STRATO_SFTP_USER` | SFTP-Benutzername |
| `STRATO_SFTP_PASSWORD` | SFTP-Passwort |
| `STRATO_REMOTE_DIR` | Zielverzeichnis der Subdomain, z. B. `/familien-planer` |
| `STRATO_SITE_URL` | Adresse der Seite, z. B. `https://planer.deine-domain.de` |
| `STRATO_DB_HOST` | Datenbank-Server, z. B. `rdbms.strato.de` |
| `STRATO_DB_NAME` | Datenbankname, z. B. `DB1234567` |
| `STRATO_DB_USER` | Datenbank-Benutzer, z. B. `U1234567` |
| `STRATO_DB_PASSWORD` | Datenbank-Passwort |
| `STRATO_DB_PORT` | optional, nur falls Strato einen Port angibt |

Die Action schreibt daraus beim Deployment `api/config.php` auf den Server
(steht nicht im Repo, wird per `.htaccess` nicht ausgeliefert).

## 5. Alte Daten aus Firebase übernehmen

Läuft automatisch im ersten Deployment, solange die neue Datenbank leer ist und
die Secrets `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_API_KEY` und
`STRATO_SITE_URL` gesetzt sind. Ist die Datenbank schon gefüllt, wird nichts
übernommen. Danach können die `VITE_FIREBASE_*`-Secrets und das Firebase-Projekt
gelöscht werden.

Von Hand: `FIREBASE_PROJECT_ID=… FIREBASE_API_KEY=… SITE_URL=https://… node scripts/migrate-from-firebase.mjs`

## Hinweise

- Synchronisierung: Jedes Gerät fragt alle 5 Sekunden (und beim Öffnen der App)
  nach Änderungen. Eingaben ohne Netz werden lokal gespeichert und nachgesendet.
- `public/.htaccess` sorgt dafür, dass `index.html` nicht gecacht wird
  (Updates kommen sofort an) und leitet auf HTTPS um.
- Alte Dateien im Zielverzeichnis werden nicht gelöscht. Die Build-Dateien haben
  eindeutige Namen, es sammeln sich also nur ein paar alte Dateien an.

## Lernhilfe (`lernhilfe/`)

**Aktueller Stand:** Die Fotoerkennung ist ausgeschaltet (`FOTOS_AKTIV = false` in
`lernhilfe/js/app.js`, `FOTOERKENNUNG: 'false'` im Workflow). Neue Themen aus Fotos
werden als Einträge in `lernhilfe/js/data-themen.js` gepflegt und auf `main` gepusht.
Zum Einschalten beide Schalter auf `true` setzen und die Secrets unten eintragen.

Statische Seite (HTML/CSS/JS) plus eine kleine PHP-Schnittstelle
(`lernhilfe/api/api.php`) für die Fotoerkennung. Bei jedem Push auf `main`, der
etwas in `lernhilfe/` ändert, installiert `.github/workflows/deploy-lernhilfe.yml`
die PHP-Bibliotheken (Composer), schreibt `api/config.php` und lädt alles per
SFTP nach `/lernhilfe` im Strato-Webspace (gleiche SFTP-Secrets wie oben).
Anderes Zielverzeichnis: Secret `STRATO_LERNHILFE_DIR` setzen.

Zusätzliche Secrets:

| Secret | Wert |
| --- | --- |
| `ANTHROPIC_API_KEY` | API-Schlüssel von console.anthropic.com (für die Fotoerkennung) |
| `LERNHILFE_CODE` | Zugangscode, den man beim ersten Auswerten eingibt (empfohlen, sonst kann jeder mit dem Link auf deine Kosten Fotos auswerten lassen) |

Die Themen aus den Fotos landen in der Tabelle `lernhilfe_themen` derselben
Datenbank wie der Familienplaner (wird automatisch angelegt). Die Fotos selbst
werden nicht gespeichert. Strato muss für die Domain PHP 8.1 oder neuer nutzen
(Strato → Einstellungen → PHP-Version).

Erreichbar ist die Seite über eine Domain/Subdomain, die bei Strato auf das
Verzeichnis `/lernhilfe` zeigt (z. B. `lernhilfe.deine-domain.de`).

Lokal testen: `cd lernhilfe/api && composer install`, eine `config.php` nach
`config.example.php` anlegen und im Ordner `lernhilfe` `php -S localhost:8000` starten.
