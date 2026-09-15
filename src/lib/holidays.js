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

export function holidayLabel(date) {
  const iso = toISODate(date)
  return HOLIDAYS.find((h) => iso >= h.start && iso <= h.end)?.label ?? null
}

export function isSchoolDay(date) {
  const iso = toISODate(date)
  if (iso < TERM_START || iso > TERM_END) return false
  if (!weekdayName(date)) return false
  if (holidayLabel(date)) return false
  return true
}
