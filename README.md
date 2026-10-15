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

Die Daten liegen in einer MySQL/MariaDB-Datenbank auf dem Webspace und werden über
`public/api/api.php` gelesen und geschrieben. Alle Geräte sehen denselben Stand
(Abgleich alle 5 Sekunden); ohne Netz wird lokal weitergearbeitet und später
nachgesendet. Bei `npm run dev` ohne Server arbeitet die App nur lokal, außer
`VITE_API_URL` zeigt auf eine laufende Schnittstelle (siehe `.env.example`).

## Build & Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) (Strato-Subdomain per GitHub Actions).
