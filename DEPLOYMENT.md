# Deployment (Strato-Subdomain)

Die App ist eine statische Vite-App. Bei jedem Push auf `main` baut GitHub Actions
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

## 2. SFTP-Zugang

Strato → Hosting → Zugänge (SFTP). Server ist in der Regel `ssh.strato.de`,
Benutzername ist die Hauptdomain oder ein eigener SFTP-Benutzer.

## 3. GitHub-Secrets eintragen

GitHub → Repo → Settings → Secrets and variables → Actions → "New repository secret":

| Secret | Wert |
| --- | --- |
| `STRATO_SFTP_HOST` | `ssh.strato.de` |
| `STRATO_SFTP_USER` | SFTP-Benutzername |
| `STRATO_SFTP_PASSWORD` | SFTP-Passwort |
| `STRATO_REMOTE_DIR` | Zielverzeichnis der Subdomain, z. B. `/familien-planer` |
| `VITE_FIREBASE_API_KEY` | aus `.env.local` |
| `VITE_FIREBASE_AUTH_DOMAIN` | aus `.env.local` |
| `VITE_FIREBASE_PROJECT_ID` | aus `.env.local` |
| `VITE_FIREBASE_STORAGE_BUCKET` | aus `.env.local` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | aus `.env.local` |
| `VITE_FIREBASE_APP_ID` | aus `.env.local` |

## 4. Firebase: Domain freigeben

Falls Firebase Authentication genutzt wird: Firebase-Konsole → Authentication →
Einstellungen → Autorisierte Domains → Subdomain (z. B. `planer.deine-domain.de`)
hinzufügen.

## Hinweise

- `public/.htaccess` sorgt dafür, dass `index.html` nicht gecacht wird
  (Updates kommen sofort an) und leitet auf HTTPS um.
- Alte Dateien im Zielverzeichnis werden nicht gelöscht. Die Build-Dateien haben
  eindeutige Namen, es sammeln sich also nur ein paar alte Dateien an.
