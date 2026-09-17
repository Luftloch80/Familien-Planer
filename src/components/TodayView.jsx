import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { weekdayName, addDays, formatShort, isSameDate } from '../lib/dates.js'
import { isSchoolDay, holidayLabel, extraSchoolDayLabel, feiertagLabel } from '../lib/holidays.js'
import { pickupTimeMatches, resolvePickup } from '../lib/pickup.js'
import { useUpdateAvailable } from '../lib/useUpdateAvailable.js'
import { FOOD_ORDER_URL } from '../data/kids.js'
import KidDayCard from './KidDayCard.jsx'
import DayScroller from './DayScroller.jsx'

const MAX_LOOKAHEAD_DAYS = 400

function nowAsHM(now) {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function latestPickupTime(date, data) {
  return KIDS.reduce((max, kid) => {
    const t = resolvePickup(kid, date, data)?.time
    return t && t > max ? t : max
  }, '')
}

function initialTarget(data) {
  const now = new Date()
  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS; offset++) {
    const date = addDays(now, offset)
    if (!isSchoolDay(date)) continue
    if (offset === 0) {
      const maxTime = latestPickupTime(date, data)
      if (maxTime && nowAsHM(now) > maxTime) continue // heute schon vorbei -> nächster Schultag
    }
    return date
  }
  return now
}

export default function TodayView({ data, store }) {
  const [target, setTarget] = useState(() => initialTarget(data))
  const today = new Date()
  const isToday = isSameDate(target, today)
  const weekday = weekdayName(target)
  const holiday = holidayLabel(target) ?? feiertagLabel(target)
  const extra = extraSchoolDayLabel(target)
  const isSchool = isSchoolDay(target)
  // Abholplan gibt es nur Mo-Fr - zusätzliche Schultage am Wochenende (z.B.
  // Basar) sind zwar Schultage, aber ohne Abholoptionen für die Kinder.
  const showPickup = isSchool && weekday
  const matches = showPickup ? pickupTimeMatches(KIDS, target, data) : []
  const updateAvailable = useUpdateAvailable()

  return (
    <div className="view view-no-padding">
      <DayScroller selected={target} onSelect={setTarget} />

      <div className="view-header view-header-padded">
        <h1>{isToday ? 'Heute' : weekday ?? 'Wochenende'}</h1>
        <p className="subtitle">
          {weekday ?? target.toLocaleDateString('de-DE', { weekday: 'long' })}, {formatShort(target)}
        </p>
      </div>

      <div className="today-list view-header-padded">
        {showPickup ? (
          KIDS.map((kid, i) => (
            <KidDayCard
              key={kid.id}
              kid={kid}
              date={target}
              data={data}
              store={store}
              sameTime={matches[i] ?? null}
            />
          ))
        ) : (
          <p className="hint">
            {extra ?? (holiday ? `${holiday} – keine Schule.` : 'An diesem Tag ist keine Schule.')}
          </p>
        )}

        <a
          className="external-link-btn"
          href={FOOD_ORDER_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          🍽️ Cantinorant
        </a>

        {updateAvailable && (
          <p className="update-banner">
            🔄 Neue Version verfügbar – bitte die App einmal schließen und wieder öffnen.
          </p>
        )}
      </div>
    </div>
  )
}
