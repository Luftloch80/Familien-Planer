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

  const chosenKey = assignment?.option ?? kid.defaultOption ?? 'regular'
  const chosenOption = options.find((o) => o.key === chosenKey) ?? options[0]

  const time = exception?.time || chosenOption?.time || null
  const label = exception?.time ? exception.note || 'Ausnahme' : chosenOption?.label
  const person = assignment?.person ?? null

  return { weekday, options, chosenKey, time, label, person, exception, key }
}

// Für jedes Kind: true = mindestens ein anderes Kind hat die gleiche Abholzeit
// (grün, ein Weg reicht für beide), false = diese Zeit ist an dem Tag einzigartig
// (rot), null = nicht anwendbar (z.B. Ferien). Reihenfolge entspricht `kids`.
export function pickupTimeMatches(kids, date, data) {
  const times = kids.map((kid) => resolvePickup(kid, date, data)?.time ?? null)
  return times.map((t, i) => {
    if (!t) return null
    return times.some((other, j) => j !== i && other === t)
  })
}
