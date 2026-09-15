# Geräte-Synchronisierung einrichten (Firebase)

Ohne diese Einrichtung funktioniert der Abholplan trotzdem – Änderungen werden dann
aber nur lokal im jeweiligen Browser gespeichert (nicht geräteübergreifend).
Mit einem kostenlosen Firebase-Projekt sehen alle Familienmitglieder auf ihrem
eigenen Handy denselben, live aktualisierten Stand.

## 1. Firebase-Projekt anlegen

1. Auf https://console.firebase.google.com/ mit einem Google-Konto anmelden.
2. "Projekt hinzufügen" → einen Namen vergeben (z.B. "familien-planer") → Projekt erstellen.
   Google Analytics kann dabei deaktiviert werden, wird nicht benötigt.

## 2. Firestore-Datenbank aktivieren

1. Im Projekt links im Menü "Build" → "Firestore Database" öffnen.
2. "Datenbank erstellen" klicken.
3. Standort auswählen (z.B. `eur3 (europe-west)`).
4. Im Modus-Dialog **"Testmodus"** wählen (offene Regeln, für den Start ausreichend).
   Die Regeln können später verschärft werden (siehe Abschnitt 4).

## 3. Web-App registrieren und Config-Werte holen

1. In der Projektübersicht auf das Web-Symbol `</>` klicken, um eine neue Web-App zu registrieren.
2. Einen Namen vergeben (z.B. "Abholplan"), Firebase Hosting kann übersprungen werden.
3. Es erscheint ein Code-Block mit `firebaseConfig = { apiKey: "...", ... }`.
   Diese Werte in eine neue Datei `.env.local` im Projektordner eintragen
   (Vorlage: `.env.example` kopieren):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. App neu starten (`npm run dev`) bzw. beim Hosting-Anbieter (Vercel/Netlify) dieselben
   Variablen unter "Environment Variables" eintragen und neu deployen.

In den Einstellungen der App zeigt ein grüner Haken, sobald die Verbindung steht.

## 4. Sicherheit (empfohlen, sobald es läuft)

Der Testmodus erlaubt jedem mit der Projekt-ID Lese-/Schreibzugriff. Für ein privates
Familientool reicht das meist aus, da die ID nicht öffentlich einsehbar ist. Wer es
etwas absichern möchte, kann in Firestore unter "Regeln" folgendes eintragen, damit nur
auf das eine erwartete Dokument zugegriffen werden kann:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /familienplaner/daten {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
