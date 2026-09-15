// Abholzeiten Schuljahr 2026/27, Freie Waldorfschule Gutenhalde
// Quelle: Stundenpläne der Kinder + Angaben der Eltern (Kernzeit-Anmeldung, AGs)
import { startOfWeek } from '../lib/dates.js'

export { WEEKDAYS } from '../lib/dates.js'

export const KIDS = [
  {
    id: 'emma',
    name: 'Emma',
    klasse: '8. Klasse',
    color: '#7c6fd6',
    schedule: {
      Montag: { regular: '13:10' },
      Dienstag: { regular: '12:25' },
      Mittwoch: { regular: '11:35' },
      Donnerstag: { regular: '13:10' },
      // Chor ist keine wählbare Option, sondern findet alle 2 Wochen statt
      // (diese Woche = Chor-Woche, ab 14.09.2026).
      Freitag: {
        regular: '13:10',
        biweekly: { label: 'Chor', time: '15:30', referenceMonday: '2026-09-14' },
      },
    },
    kernzeit: null,
  },
  {
    id: 'charlotte',
    name: 'Charlotte',
    klasse: '3. Klasse',
    color: '#2f9e8f',
    schedule: {
      Montag: { regular: '12:25' },
      Dienstag: { regular: '11:35' },
      Mittwoch: { regular: '11:35' },
      Donnerstag: { regular: '12:25' },
      Freitag: { regular: '11:35' },
    },
    kernzeit: '13:10',
  },
  {
    id: 'rosi',
    name: 'Rosi',
    klasse: '2. Klasse',
    color: '#d67a3b',
    schedule: {
      Montag: { regular: '11:35' },
      Dienstag: { regular: '11:35' },
      Mittwoch: { regular: '11:35' },
      Donnerstag: { regular: '12:25' },
      Freitag: { regular: '12:25' },
    },
    kernzeit: '13:10',
  },
]

export function getKid(id) {
  return KIDS.find((k) => k.id === id)
}

function isBiweeklyActiveWeek(date, referenceMondayISO) {
  const monday = startOfWeek(date)
  const ref = startOfWeek(new Date(`${referenceMondayISO}T00:00:00`))
  const diffWeeks = Math.round((monday - ref) / (7 * 86400000))
  return ((diffWeeks % 2) + 2) % 2 === 0
}

// Abhol-Optionen (Zeit + Bezeichnung) für ein Kind an einem konkreten Datum.
// `date` wird für Regelungen gebraucht, die nicht jede Woche gleich sind (z.B. Chor alle 2 Wochen).
export function pickupOptions(kid, weekday, date) {
  const day = kid.schedule[weekday]
  if (!day) return []

  const options = []
  if (day.biweekly && date && isBiweeklyActiveWeek(date, day.biweekly.referenceMonday)) {
    options.push({ key: 'regular', label: day.biweekly.label, time: day.biweekly.time })
  } else {
    options.push({ key: 'regular', label: 'Schulschluss', time: day.regular })
  }

  if (kid.kernzeit) options.push({ key: 'kernzeit', label: 'Kernzeit Abholung', time: kid.kernzeit })
  return options.sort((a, b) => a.time.localeCompare(b.time))
}
