# Abholplan

Dashboard zur Planung der Schulabholung von Emma, Charlotte und Rosi
(Freie Waldorfschule Gutenhalde, Schuljahr 2026/27).

## Funktionen

- **Heute**: Abholzeiten aller Kinder für den aktuellen Schultag, sortiert nach Uhrzeit.
- **Woche**: Wochenübersicht mit Navigation zwischen den Kalenderwochen.
- Pro Kind/Tag: Wahl zwischen Schulschluss, Kernzeit und AGs (z.B. Chor), Zuweisung
  der Abholperson, sowie Ausnahmen für einzelne Tage (abweichende Zeit + Notiz).
- **Einstellungen**: Abholpersonen verwalten, Sync-Status, Stundenplan-Übersicht.

## Entwicklung

```bash
npm install
npm run dev
```

## Geräte-Synchronisierung

Standardmäßig werden Änderungen nur lokal im Browser gespeichert. Für eine
Synchronisierung zwischen mehreren Geräten (z.B. den Handys beider Elternteile)
siehe [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Build & Deployment

```bash
npm run build
```

Erzeugt einen statischen `dist/`-Ordner, der z.B. auf Vercel, Netlify oder
GitHub Pages gehostet werden kann. Bei Nutzung der Firebase-Synchronisierung
müssen die `VITE_FIREBASE_*`-Umgebungsvariablen beim Hosting-Anbieter hinterlegt werden.
