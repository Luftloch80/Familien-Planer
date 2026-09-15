import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { weekdayName, addDays, formatShort, isSameDate } from '../lib/dates.js'
import { resolvePickup } from '../lib/pickup.js'
import KidDayCard from './KidDayCard.jsx'
import DayScroller from './DayScroller.jsx'

function initialTarget() {
  const now = new Date()
  if (weekdayName(now)) return now
  // Wochenende -> nächster Montag
  const offset = now.getDay() === 0 ? 1 : 2
  return addDays(now, offset)
}

export default function TodayView({ data, store }) {
  const [target, setTarget] = useState(initialTarget)
  const today = new Date()
  const isToday = isSameDate(target, today)
  const weekday = weekdayName(target)

  const results = weekday
    ? KIDS.map((kid) => ({ kid, result: resolvePickup(kid, target, data) })).sort((a, b) =>
        (a.result?.time ?? '').localeCompare(b.result?.time ?? ''),
      )
    : []

  return (
    <div className="view view-no-padding">
      <DayScroller selected={target} onSelect={setTarget} />

      <div className="view-header view-header-padded">
        <h1>{isToday ? 'Heute' : weekday ? weekday : 'Wochenende'}</h1>
        <p className="subtitle">
          {weekday ?? target.toLocaleDateString('de-DE', { weekday: 'long' })}, {formatShort(target)}
        </p>
      </div>

      <div className="today-list view-header-padded">
        {weekday ? (
          results.map(({ kid }) => (
            <KidDayCard key={kid.id} kid={kid} date={target} data={data} store={store} />
          ))
        ) : (
          <p className="hint">An diesem Tag ist keine Schule.</p>
        )}
      </div>
    </div>
  )
}
