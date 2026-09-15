import { pickupOptions } from '../data/kids.js'
import { weekdayName, toISODate } from './dates.js'
import { assignmentKey } from './store.js'
import { isSchoolDay } from './holidays.js'

// Fasst Stundenplan-Optionen, Zuweisung (wer holt ab) und Tages-Ausnahme
// zu einem konkreten Abhol-Ergebnis für ein Kind an einem Datum zusammen.
export function resolvePickup(kid, date, data) {
  const weekday = weekdayName(date)
  if (!weekday || !isSchoolDay(date)) return null // Wochenende oder Ferien

  const key = assignmentKey(toISODate(date), kid.id)
  const options = pickupOptions(kid, weekday, date)
  const assignment = data.assignments[key]
  const exception = data.exceptions[key]

  const chosenKey = assignment?.option ?? 'regular'
  const chosenOption = options.find((o) => o.key === chosenKey) ?? options[0]

  const time = exception?.time || chosenOption?.time || null
  const label = exception?.time ? exception.note || 'Ausnahme' : chosenOption?.label
  const person = assignment?.person ?? null

  return { weekday, options, chosenKey, time, label, person, exception, key }
}

// true = alle Kinder werden zur gleichen Uhrzeit abgeholt (ein Weg reicht),
// false = die Zeiten unterscheiden sich, null = nicht anwendbar (z.B. Ferien).
export function allPickupTimesMatch(kids, date, data) {
  const times = kids.map((kid) => resolvePickup(kid, date, data)?.time ?? null)
  if (times.some((t) => !t)) return null
  return times.every((t) => t === times[0])
}
