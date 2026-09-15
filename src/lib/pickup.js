import { pickupOptions, KIDS } from '../data/kids.js'
import { weekdayName, toISODate } from './dates.js'
import { assignmentKey } from './store.js'
import { isSchoolDay } from './holidays.js'

// Haben an diesem Tag alle Kinder zur gleichen Zeit regulär Schulschluss?
// Dann macht eine separate Kernzeit-Betreuung keinen Sinn mehr - alle
// können direkt gemeinsam abgeholt werden.
function allKidsShareRegularTime(weekday, date) {
  const times = KIDS.map((k) => pickupOptions(k, weekday, date).find((o) => o.key === 'regular')?.time)
  return times.every((t) => t && t === times[0])
}

// Fasst Stundenplan-Optionen, Zuweisung (wer holt ab) und Tages-Ausnahme
// zu einem konkreten Abhol-Ergebnis für ein Kind an einem Datum zusammen.
export function resolvePickup(kid, date, data) {
  const weekday = weekdayName(date)
  if (!weekday || !isSchoolDay(date)) return null // Wochenende oder Ferien

  const key = assignmentKey(toISODate(date), kid.id)
  const options = pickupOptions(kid, weekday, date)
  const assignment = data.assignments[key]
  const exception = data.exceptions[key]

  const defaultKey = allKidsShareRegularTime(weekday, date) ? 'regular' : (kid.defaultOption ?? 'regular')
  const chosenKey = assignment?.option ?? defaultKey
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
