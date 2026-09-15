export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function weekdayName(date) {
  // JS: 0=Sunday..6=Saturday. Our WEEKDAYS array is Montag..Freitag.
  const idx = date.getDay() - 1
  return idx >= 0 && idx < 5 ? WEEKDAYS[idx] : null
}

export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() || 7 // Sonntag -> 7
  if (day !== 1) d.setDate(d.getDate() - (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function getWeekDays(baseDate) {
  const monday = startOfWeek(baseDate)
  return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
}

export function formatShort(date) {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function isSameDate(a, b) {
  return toISODate(a) === toISODate(b)
}
