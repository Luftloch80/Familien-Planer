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

## 4. Sicherheit (wichtig: Testmodus läuft nach 30 Tagen ab!)

Der Testmodus erlaubt zwar jedem mit der Projekt-ID Lese-/Schreibzugriff, aber nur
**befristet für 30 Tage** - danach lehnt Firestore automatisch ALLE Anfragen ab (nicht
nur ungesicherte), die App wäre also komplett offline. Deshalb möglichst bald durch
dauerhafte Regeln ersetzen, die nur auf das eine erwartete Dokument zugreifen lassen
(ohne Ablaufdatum). Die Regeln liegen bereits im Repo unter `firestore.rules` - in der
Firebase-Konsole unter Firestore Database → Regeln den Inhalt dieser Datei einfügen und
"Veröffentlichen" klicken (oder mit installierter Firebase-CLI: `firebase deploy --only
firestore:rules`, Projekt ist in `.firebaserc` hinterlegt).
