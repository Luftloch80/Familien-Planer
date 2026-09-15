import { useEffect, useRef } from 'react'
import { addDays, isSameDate, toISODate } from '../lib/dates.js'
import { isSchoolDay } from '../lib/holidays.js'

const SCHOOL_DAYS_AHEAD = 30 // ca. 6 Wochen
const MAX_LOOKAHEAD_DAYS = 400 // Sicherheitsgrenze, falls das Schuljahr zu Ende ist

export default function DayScroller({ selected, onSelect }) {
  const scrollerRef = useRef(null)
  const activeRef = useRef(null)

  const today = new Date()
  const days = []
  for (let offset = 0; offset < MAX_LOOKAHEAD_DAYS && days.length < SCHOOL_DAYS_AHEAD; offset++) {
    const date = addDays(today, offset)
    if (isSchoolDay(date)) days.push(date)
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
