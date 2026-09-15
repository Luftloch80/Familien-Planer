import { useState } from 'react'
import { KIDS, pickupOptions } from '../data/kids.js'
import { weekdayName, toISODate } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export default function MonthOverview({ data, onClose }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [selectedKidIds, setSelectedKidIds] = useState(() => KIDS.map((k) => k.id))

  function changeMonth(delta) {
    let m = monthIndex + delta
    let y = year
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setMonthIndex(m)
    setYear(y)
  }

  function toggleKid(id) {
    setSelectedKidIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    )
  }

  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  const days = Array.from({ length: daysInMonth(year, monthIndex) }, (_, i) => new Date(year, monthIndex, i + 1))
  const kids = KIDS.filter((k) => selectedKidIds.includes(k.id))

  return (
    <div className="month-overview">
      <div className="month-overview-toolbar no-print">
        <button className="btn-small" onClick={onClose}>
          ← Zurück
        </button>
        <div className="month-nav">
          <button className="nav-btn" onClick={() => changeMonth(-1)} aria-label="Vorheriger Monat">
            ‹
          </button>
          <strong>{monthLabel}</strong>
          <button className="nav-btn" onClick={() => changeMonth(1)} aria-label="Nächster Monat">
            ›
          </button>
        </div>
        <button className="btn-small btn-primary" onClick={() => window.print()}>
          Drucken / Als PDF speichern
        </button>
      </div>

      <div className="month-kid-picker no-print">
        {KIDS.map((kid) => (
          <label key={kid.id} className="month-kid-checkbox">
            <input
              type="checkbox"
              checked={selectedKidIds.includes(kid.id)}
              onChange={() => toggleKid(kid.id)}
            />
            <span style={{ color: kid.color }}>{kid.name}</span>
          </label>
        ))}
      </div>

      <h1 className="month-overview-title">Monatsübersicht {monthLabel}</h1>

      <table className="month-table">
        <thead>
          <tr>
            <th>Datum</th>
            {kids.map((kid) => (
              <th key={kid.id}>{kid.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((date) => {
            const weekday = weekdayName(date)
            const holiday = holidayLabel(date)
            const school = isSchoolDay(date)
            return (
              <tr key={toISODate(date)} className={!weekday ? 'month-row-weekend' : !school ? 'month-row-holiday' : ''}>
                <td className="month-date-cell">
                  {date.toLocaleDateString('de-DE', { weekday: 'short' })} {date.getDate()}.
                </td>
                {kids.map((kid) => {
                  if (!weekday) return <td key={kid.id} />
                  if (!school) {
                    return (
                      <td key={kid.id} className="month-holiday-cell">
                        {holiday ?? 'frei'}
                      </td>
                    )
                  }
                  const options = pickupOptions(kid, weekday, date)
                  const events = Object.values(data.recurringEvents?.[kid.id] ?? {}).filter(
                    (ev) => ev.weekday === weekday,
                  )
                  return (
                    <td key={kid.id}>
                      <div className="month-options">
                        {options.map((opt) => (
                          <span key={opt.key}>
                            {opt.label} {opt.time}
                          </span>
                        ))}
                      </div>
                      {events.length > 0 && (
                        <div className="month-events">
                          {events.map((ev, i) => (
                            <span key={i}>
                              {ev.title} {ev.time}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
