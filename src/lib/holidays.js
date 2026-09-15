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

export function holidayLabel(date) {
  const iso = toISODate(date)
  return HOLIDAYS.find((h) => iso >= h.start && iso <= h.end)?.label ?? null
}

export function extraSchoolDayLabel(date) {
  const iso = toISODate(date)
  return EXTRA_SCHOOL_DAYS.find((d) => d.date === iso)?.label ?? null
}

export function isSchoolDay(date) {
  const iso = toISODate(date)
  if (iso < TERM_START || iso > TERM_END) return false
  if (extraSchoolDayLabel(date)) return true
  if (!weekdayName(date)) return false
  if (holidayLabel(date)) return false
  return true
}
