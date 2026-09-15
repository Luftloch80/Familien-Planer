// Abholzeiten Schuljahr 2026/27, Freie Waldorfschule Gutenhalde
// Quelle: Stundenpläne der Kinder + Angaben der Eltern (Kernzeit-Anmeldung, AGs, Rotation)
import { startOfWeek, addDays } from '../lib/dates.js'
import { isSchoolDay } from '../lib/holidays.js'

export { WEEKDAYS } from '../lib/dates.js'

export const KIDS = [
  {
    id: 'emma',
    name: 'Emma',
    klasse: '8. Klasse',
    color: '#7c6fd6',
    schedule: {
      Montag: { regular: '13:10' },
      Dienstag: { regular: '13:10' },
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
    // Handarbeit/Werken/Gartenbau im 3-Wochen-Rhythmus (diese Woche = Werken).
    // Ändert an Mo/Mi/Do die Schulschluss-Zeit, je nachdem welche Gruppe dran ist.
    // Ferienwochen zählen beim Weiterzählen des Rhythmus nicht mit.
    rotation: {
      referenceMonday: '2026-09-14',
      cycle: ['We', 'Ha', 'Ga'],
      overrides: {
        Montag: { We: '13:10', Ha: '13:10', Ga: '12:25' },
        Mittwoch: { We: '11:35', Ha: '13:10', Ga: '13:10' },
        Donnerstag: { We: '13:10', Ha: '11:35', Ga: '13:10' },
      },
    },
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
    defaultOption: 'kernzeit',
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
    defaultOption: 'kernzeit',
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

function isFullyHolidayWeek(monday) {
  for (let i = 0; i < 5; i++) {
    if (isSchoolDay(addDays(monday, i))) return false
  }
  return true
}

// Zählt aktive (nicht komplett in den Ferien liegende) Wochen zwischen zwei Montagen (a <= b).
function countActiveWeeksBetween(a, b) {
  let count = 0
  let cur = new Date(a)
  while (cur < b) {
    if (!isFullyHolidayWeek(cur)) count++
    cur = addDays(cur, 7)
  }
  return count
}

// Welche Phase eines mehrwöchigen Rhythmus an einem Datum aktiv ist.
// Ferienwochen (komplett schulfrei) zählen beim Weiterschalten nicht mit.
function rotationPhase(date, rotation) {
  const targetMonday = startOfWeek(date)
  const refMonday = startOfWeek(new Date(`${rotation.referenceMonday}T00:00:00`))
  const count =
    targetMonday >= refMonday
      ? countActiveWeeksBetween(refMonday, targetMonday)
      : -countActiveWeeksBetween(targetMonday, refMonday)
  const n = rotation.cycle.length
  const idx = ((count % n) + n) % n
  return rotation.cycle[idx]
}

// Abhol-Optionen (Zeit + Bezeichnung) für ein Kind an einem konkreten Datum.
// `date` wird für Regelungen gebraucht, die nicht jede Woche gleich sind
// (z.B. Chor alle 2 Wochen, Handarbeit/Werken/Gartenbau im 3-Wochen-Rhythmus).
export function pickupOptions(kid, weekday, date) {
  const day = kid.schedule[weekday]
  if (!day) return []

  const options = []
  const rotationOverride = kid.rotation?.overrides?.[weekday]

  if (day.biweekly && date && isBiweeklyActiveWeek(date, day.biweekly.referenceMonday)) {
    options.push({ key: 'regular', label: 'Schulschluss', time: day.biweekly.time })
  } else if (rotationOverride && date) {
    const phase = rotationPhase(date, kid.rotation)
    options.push({ key: 'regular', label: 'Schulschluss', time: rotationOverride[phase] })
  } else {
    options.push({ key: 'regular', label: 'Schulschluss', time: day.regular })
  }

  if (kid.kernzeit) options.push({ key: 'kernzeit', label: 'Kernzeit Abholung', time: kid.kernzeit })
  return options.sort((a, b) => a.time.localeCompare(b.time))
}
