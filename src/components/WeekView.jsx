import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { getWeekDays, addDays, formatShort, isSameDate, toISODate } from '../lib/dates.js'
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
        {days.map((date) => (
          <div className="day-column" key={toISODate(date)}>
            <div className={`day-heading ${isSameDate(date, today) ? 'is-today' : ''}`}>
              <span>{date.toLocaleDateString('de-DE', { weekday: 'long' })}</span>
              <span className="day-date">{formatShort(date)}</span>
            </div>
            {KIDS.map((kid) => (
              <KidDayCard key={kid.id} kid={kid} date={date} data={data} store={store} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
