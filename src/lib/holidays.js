import { toISODate, weekdayName } from './dates.js'

// Schuljahr 2026/27, Freie Waldorfschule Gutenhalde (Baden-Württemberg).
// Quelle: Rotationsplan Handarbeit/Werken/Gartenbau der Schule.
export const TERM_START = '2026-09-14'
export const TERM_END = '2027-07-28'

export const HOLIDAYS = [
  { label: 'Herbstferien', start: '2026-10-26', end: '2026-10-30' },
  { label: 'Weihnachtsferien', start: '2026-12-23', end: '2027-01-08' },
  { label: 'Faschingsferien', start: '2027-02-08', end: '2027-02-12' },
  { label: 'Osterferien', start: '2027-03-22', end: '2027-04-02' },
  { label: 'Pfingstferien', start: '2027-05-17', end: '2027-06-04' },
]

// Zusätzliche Schultage laut Jahresplan: Schulveranstaltungen an sich
// Wochenendtagen, für die es trotzdem regulär Schule (aber keinen
// Abholplan, da der nur für Mo-Fr definiert ist) gibt.
export const EXTRA_SCHOOL_DAYS = [
  { date: '2026-10-10', label: 'Tag der offenen Tür' },
  { date: '2026-11-07', label: 'Basar Aufbau' },
  { date: '2026-11-08', label: 'Basar' },
  { date: '2026-11-28', label: 'Schulfeier' },
  { date: '2027-06-26', label: 'Schulfeier/Sommerfest/Johannifeuer' },
]

// Gesetzliche Feiertage laut Jahresplan. Die meisten liegen bereits
// innerhalb einer HOLIDAYS-Ferienspanne; Christi Himmelfahrt (06.05.2027)
// ist der einzige, der frei zwischen zwei Ferienblöcken liegt.
export const FEIERTAGE = [
  { date: '2026-10-03', label: 'Tag der Deutschen Einheit' },
  { date: '2026-11-01', label: 'Allerheiligen' },
  { date: '2026-12-25', label: '1. Weihnachtstag' },
  { date: '2026-12-26', label: '2. Weihnachtstag' },
  { date: '2027-01-01', label: 'Neujahr' },
  { date: '2027-01-06', label: 'Heilige Drei Könige' },
  { date: '2027-03-26', label: 'Karfreitag' },
  { date: '2027-03-29', label: 'Ostermontag' },
  { date: '2027-05-01', label: 'Tag der Arbeit' },
  { date: '2027-05-06', label: 'Christi Himmelfahrt' },
  { date: '2027-05-17', label: 'Pfingstmontag' },
  { date: '2027-05-27', label: 'Fronleichnam' },
]

export function holidayLabel(date) {
  const iso = toISODate(date)
  return HOLIDAYS.find((h) => iso >= h.start && iso <= h.end)?.label ?? null
}

export function extraSchoolDayLabel(date) {
  const iso = toISODate(date)
  return EXTRA_SCHOOL_DAYS.find((d) => d.date === iso)?.label ?? null
}

export function feiertagLabel(date) {
  const iso = toISODate(date)
  return FEIERTAGE.find((f) => f.date === iso)?.label ?? null
}

export function isSchoolDay(date) {
  const iso = toISODate(date)
  if (iso < TERM_START || iso > TERM_END) return false
  if (extraSchoolDayLabel(date)) return true
  if (!weekdayName(date)) return false
  if (holidayLabel(date)) return false
  if (feiertagLabel(date)) return false
  return true
}
