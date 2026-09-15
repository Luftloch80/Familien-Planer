# Deployment (Vercel)

Die App ist eine statische Vite-App und lässt sich kostenlos auf Vercel hosten.

## 1. Projekt importieren

1. Auf https://vercel.com mit GitHub einloggen.
2. "Add New..." → "Project" → das Repo `Luftloch80/Familien-Planer` auswählen.
3. Vercel erkennt Vite automatisch (Build Command `npm run build`, Output `dist`) –
   nichts ändern, direkt weiter.

## 2. Firebase-Variablen eintragen

Vor dem ersten Deploy unter "Environment Variables" die gleichen 6 Werte eintragen,
die auch in `.env.local` stehen (aus der Firebase-Konsole → Projekteinstellungen →
"Meine Apps" → Web-App → Config):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Dann auf "Deploy" klicken.

## 3. Fertig

Vercel gibt eine URL wie `familien-planer.vercel.app` aus – die kann man sich
als App-Icon auf dem Homescreen speichern ("Zum Home-Bildschirm hinzufügen"
im Browser-Menü, funktioniert bei iOS/Android wie eine App).

Jeder Push auf den Branch, der mit Vercel verbunden ist, deployed automatisch
neu.
