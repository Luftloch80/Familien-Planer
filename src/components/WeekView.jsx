import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { getWeekDays, addDays, formatShort, isSameDate, toISODate } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'
import { allPickupTimesMatch } from '../lib/pickup.js'
import KidDayCard from './KidDayCard.jsx'

export default function WeekView({ data, store }) {
  const [weekStart, setWeekStart] = useState(new Date())
  const days = getWeekDays(weekStart)
  const today = new Date()

  return (
    <div className="view">
      <div className="view-header week-header">
        <button className="nav-btn" onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Vorherige Woche">
          ‹
        </button>
        <h1>Woche</h1>
        <button className="nav-btn" onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Nächste Woche">
          ›
        </button>
      </div>

      <div className="week-grid">
        {days.map((date) => {
          const holiday = holidayLabel(date)
          const school = isSchoolDay(date)
          const sameTime = school ? allPickupTimesMatch(KIDS, date, data) : null
          return (
            <div className="day-column" key={toISODate(date)}>
              <div className={`day-heading ${isSameDate(date, today) ? 'is-today' : ''}`}>
                <span>{date.toLocaleDateString('de-DE', { weekday: 'long' })}</span>
                <span className="day-date">{formatShort(date)}</span>
              </div>
              {school ? (
                KIDS.map((kid) => (
                  <KidDayCard
                    key={kid.id}
                    kid={kid}
                    date={date}
                    data={data}
                    store={store}
                    sameTime={sameTime}
                  />
                ))
              ) : (
                <p className="hint">{holiday ? `${holiday} – keine Schule` : 'keine Schule'}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
