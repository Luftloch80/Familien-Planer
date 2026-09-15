import { useEffect, useRef } from 'react'
import { addDays, isSameDate, toISODate, weekdayName } from '../lib/dates.js'

const SCHOOL_DAYS_AHEAD = 30 // ca. 6 Wochen

export default function DayScroller({ selected, onSelect }) {
  const scrollerRef = useRef(null)
  const activeRef = useRef(null)

  const today = new Date()
  const days = []
  for (let offset = 0, found = 0; found < SCHOOL_DAYS_AHEAD; offset++) {
    const date = addDays(today, offset)
    if (weekdayName(date)) {
      days.push(date)
      found++
    }
  }

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div className="day-scroller" ref={scrollerRef}>
      {days.map((date) => {
        const isSelected = isSameDate(date, selected)
        return (
          <button
            key={toISODate(date)}
            ref={isSelected ? activeRef : null}
            className={`day-pill ${isSelected ? 'day-pill-active' : ''} ${
              isSameDate(date, today) ? 'day-pill-today' : ''
            }`}
            onClick={() => onSelect(date)}
          >
            <span className="day-pill-weekday">
              {date.toLocaleDateString('de-DE', { weekday: 'short' })}
            </span>
            <span className="day-pill-date">{date.getDate()}.</span>
          </button>
        )
      })}
    </div>
  )
}
