import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { weekdayName, toISODate, isSameDate } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'
import { resolvePickup } from '../lib/pickup.js'

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Montag=0 .. Sonntag=6 (JS getDay() liefert Sonntag=0, das passt nicht zu
// einer Mo-So-Kalenderwoche).
function mondayIndex(date) {
  return (date.getDay() + 6) % 7
}

function eventLine(title, time, endTime) {
  if (!time) return title
  return `${title} ${time}${endTime ? `–${endTime}` : ''}`
}

function dayInfo(date, data) {
  const dateISO = toISODate(date)
  const weekday = weekdayName(date)
  const school = isSchoolDay(date)
  const holiday = holidayLabel(date)

  const perKid = KIDS.map((kid) => {
    const kidPickup = resolvePickup(kid, date, data)
    const recurring = weekday
      ? Object.values(data.recurringEvents?.[kid.id] ?? {}).filter((e) => e.weekday === weekday)
      : []
    const oneOff = Object.values(data.oneOffEvents ?? {}).filter(
      (e) => e.kidId === kid.id && e.date && dateISO >= e.date && dateISO <= (e.endDate || e.date),
    )
    return { kid, pickup: kidPickup, recurring, oneOff }
  })

  const hasExtras = perKid.some((p) => p.recurring.length > 0 || p.oneOff.length > 0)

  return { dateISO, weekday, school, holiday, perKid, hasExtras }
}

export default function CalendarView({ data }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [selectedISO, setSelectedISO] = useState(() => toISODate(now))

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

  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  const totalDays = daysInMonth(year, monthIndex)
  const leadingBlanks = mondayIndex(new Date(year, monthIndex, 1))
  const days = Array.from({ length: totalDays }, (_, i) => new Date(year, monthIndex, i + 1))

  const selectedDate = days.find((d) => toISODate(d) === selectedISO) ?? null
  const selectedInfo = selectedDate ? dayInfo(selectedDate, data) : null
  const selectedIsFlightDay = selectedInfo && (data.flightDates ?? []).includes(selectedInfo.dateISO)
  const selectedIsEarly = selectedInfo && (data.earlyCheckinDates ?? []).includes(selectedInfo.dateISO)

  return (
    <div className="view">
      <div className="view-header">
        <h1>Kalender</h1>
      </div>

      <section className="settings-section">
        <div className="month-nav calendar-nav">
          <button className="nav-btn" onClick={() => changeMonth(-1)} aria-label="Vorheriger Monat">
            ‹
          </button>
          <strong>{monthLabel}</strong>
          <button className="nav-btn" onClick={() => changeMonth(1)} aria-label="Nächster Monat">
            ›
          </button>
        </div>

        <div className="calendar-weekday-row">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="calendar-cell calendar-cell-empty" />
          ))}
          {days.map((date) => {
            const info = dayInfo(date, data)
            const isToday = isSameDate(date, now)
            const isSelected = info.dateISO === selectedISO
            const isEarly = (data.earlyCheckinDates ?? []).includes(info.dateISO)
            const isHome = !isEarly && (data.homeDates ?? []).includes(info.dateISO)
            const cellClass = [
              'calendar-cell',
              !info.school ? 'calendar-cell-off' : '',
              isHome ? 'calendar-cell-home' : '',
              isEarly ? 'calendar-cell-early' : '',
              isToday ? 'calendar-cell-today' : '',
              isSelected ? 'calendar-cell-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button key={info.dateISO} type="button" className={cellClass} onClick={() => setSelectedISO(info.dateISO)}>
                <span className="calendar-cell-num">{date.getDate()}</span>
                {info.hasExtras && (
                  <span className="calendar-cell-dots">
                    {info.perKid
                      .filter((p) => p.recurring.length > 0 || p.oneOff.length > 0)
                      .map((p) => (
                        <span key={p.kid.id} className="calendar-dot" style={{ background: p.kid.color }} />
                      ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {selectedInfo && (
        <section className="settings-section">
          <h2>
            {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </h2>

          {!selectedInfo.school && (
            <p className="status-warn">
              {selectedInfo.holiday ? `${selectedInfo.holiday} – keine Schule` : 'Kein Schultag'}
            </p>
          )}

          {selectedIsFlightDay && <p className="status-warn">✈️ Flugtag</p>}
          {selectedIsEarly && <p className="status-warn">🟠 Früher Check-in am nächsten Tag (vor 09:00)</p>}
          {!selectedIsFlightDay && !selectedIsEarly && (data.homeDates ?? []).includes(selectedInfo.dateISO) && (
            <p className="status-warn">🏠 Zu Hause</p>
          )}

          {selectedInfo.perKid.every((p) => !p.pickup && p.recurring.length === 0 && p.oneOff.length === 0) ? (
            <p className="status-warn">Keine Termine an diesem Tag.</p>
          ) : (
            selectedInfo.perKid.map(({ kid, pickup, recurring, oneOff }) => {
              if (!pickup && recurring.length === 0 && oneOff.length === 0) return null
              return (
                <div key={kid.id} className="calendar-day-kid">
                  <strong style={{ color: kid.color }}>{kid.name}</strong>
                  <ul className="kid-schedule-summary">
                    {pickup && (
                      <li>
                        {pickup.label} {pickup.time} – {pickup.person ?? 'wer holt?'}
                      </li>
                    )}
                    {recurring.map((e, i) => (
                      <li key={`r${i}`}>{eventLine(e.title, e.time, e.endTime)}</li>
                    ))}
                    {oneOff.map((e, i) => (
                      <li key={`o${i}`}>{eventLine(e.reason, e.time, e.endTime)}</li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}
        </section>
      )}
    </div>
  )
}
