import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { weekdayName, addDays, formatShort, isSameDate } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'
import { pickupTimeMatches } from '../lib/pickup.js'
import KidDayCard from './KidDayCard.jsx'
import DayScroller from './DayScroller.jsx'

const MAX_LOOKAHEAD_DAYS = 400

function initialTarget() {
  const now = new Date()
  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS; offset++) {
    const date = addDays(now, offset)
    if (isSchoolDay(date)) return date
  }
  return now
}

export default function TodayView({ data, store }) {
  const [target, setTarget] = useState(initialTarget)
  const today = new Date()
  const isToday = isSameDate(target, today)
  const weekday = weekdayName(target)
  const holiday = holidayLabel(target)
  const isSchool = isSchoolDay(target)
  const matches = isSchool ? pickupTimeMatches(KIDS, target, data) : []

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
        {isSchool ? (
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
          <p className="hint">{holiday ? `${holiday} – keine Schule.` : 'An diesem Tag ist keine Schule.'}</p>
        )}
      </div>
    </div>
  )
}
