import { useEffect, useRef } from 'react'
import { addDays, isSameDate, toISODate, startOfWeek } from '../lib/dates.js'

const WEEKS_BEFORE = 2
const WEEKS_AFTER = 6

export default function DayScroller({ selected, onSelect }) {
  const scrollerRef = useRef(null)
  const activeRef = useRef(null)

  const monday = startOfWeek(new Date())
  const start = addDays(monday, -7 * WEEKS_BEFORE)
  const days = []
  for (let w = 0; w < WEEKS_BEFORE + WEEKS_AFTER + 1; w++) {
    for (let d = 0; d < 5; d++) {
      days.push(addDays(start, w * 7 + d))
    }
  }

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  const today = new Date()

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
