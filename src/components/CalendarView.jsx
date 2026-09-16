import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { weekdayName, toISODate, isSameDate, startOfWeek, addDays, isoWeekNumber } from '../lib/dates.js'
import { isSchoolDay, holidayLabel, extraSchoolDayLabel, feiertagLabel } from '../lib/holidays.js'

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const VIEW_MODES = [
  { key: 'month', label: 'Monat' },
  { key: 'week', label: 'Woche' },
  { key: 'day', label: 'Tag' },
]

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

// Nur die Termine (wiederkehrend + einmalig) pro Kind - die Abholzeiten
// gehören zur Schule-Ansicht, nicht in den Kalender.
function dayInfo(date, data) {
  const dateISO = toISODate(date)
  const weekday = weekdayName(date)
  const school = isSchoolDay(date)
  const holiday = holidayLabel(date) ?? feiertagLabel(date)

  const perKid = KIDS.map((kid) => {
    const recurring = weekday
      ? Object.values(data.recurringEvents?.[kid.id] ?? {}).filter((e) => e.weekday === weekday)
      : []
    const oneOff = Object.values(data.oneOffEvents ?? {}).filter(
      (e) => e.kidId === kid.id && e.date && dateISO >= e.date && dateISO <= (e.endDate || e.date),
    )
    return { kid, recurring, oneOff }
  })

  const hasExtras = perKid.some((p) => p.recurring.length > 0 || p.oneOff.length > 0)

  return { dateISO, weekday, school, holiday, perKid, hasExtras }
}

export default function CalendarView({ data }) {
  const now = new Date()
  const [viewMode, setViewMode] = useState('month')
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(now))
  const [selectedISO, setSelectedISO] = useState(() => toISODate(now))

  function switchMode(mode) {
    setViewMode(mode)
    const base = new Date(`${selectedISO}T00:00:00`)
    if (mode === 'week') {
      setWeekAnchor(startOfWeek(base))
    } else if (mode === 'month') {
      setYear(base.getFullYear())
      setMonthIndex(base.getMonth())
    }
  }

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

  function changeWeek(delta) {
    setWeekAnchor((prev) => addDays(prev, delta * 7))
    setSelectedISO((prevISO) => toISODate(addDays(new Date(`${prevISO}T00:00:00`), delta * 7)))
  }

  function changeDay(delta) {
    setSelectedISO((prevISO) => toISODate(addDays(new Date(`${prevISO}T00:00:00`), delta)))
  }

  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  const totalDays = daysInMonth(year, monthIndex)
  const leadingBlanks = mondayIndex(new Date(year, monthIndex, 1))
  const monthDays = Array.from({ length: totalDays }, (_, i) => new Date(year, monthIndex, i + 1))

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i))
  const weekLabel = `KW ${isoWeekNumber(weekAnchor)} · ${weekDays[0].toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  })} – ${weekDays[6].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`

  const periodDays = viewMode === 'week' ? weekDays : monthDays
  const periodTermineDays = periodDays
    .map((date) => ({ date, info: dayInfo(date, data) }))
    .filter(({ info }) => info.hasExtras)

  const selectedDate = new Date(`${selectedISO}T00:00:00`)
  const selectedInfo = dayInfo(selectedDate, data)
  const selectedIsOrange = (data.orangeDates ?? []).includes(selectedInfo.dateISO)
  const selectedIsAway = (data.awayDates ?? []).includes(selectedInfo.dateISO)
  const selectedIsFlightDay = (data.flightDates ?? []).includes(selectedInfo.dateISO)

  function renderDayCell(date) {
    const info = dayInfo(date, data)
    const isToday = isSameDate(date, now)
    const isSelected = info.dateISO === selectedISO
    const isFlightDay = (data.flightDates ?? []).includes(info.dateISO)
    const isOrange = (data.orangeDates ?? []).includes(info.dateISO)
    const isAway = (data.awayDates ?? []).includes(info.dateISO)
    // Grün ist der Normalfall (zu Hause): alles außer Flugtagen, dem
    // Orange-Hinweis (früher Check-in morgen oder Umlauf-Start nach
    // 09:00 heute) und bekannten Layover-Tagen (awayDates) gilt als
    // Zuhause-Tag, auch ohne explizite Daten.
    const isHome = !isFlightDay && !isOrange && !isAway
    // Rot: reine Flugtage (nicht orange) und Layover-Tage ohne
    // eigenen Flug (awayDates) - beides Tage, an denen man nicht
    // zu Hause ist.
    const isRed = (isFlightDay && !isOrange) || isAway
    const cellClass = [
      'calendar-cell',
      !info.school ? 'calendar-cell-off' : '',
      isHome ? 'calendar-cell-home' : '',
      isRed ? 'calendar-cell-red' : '',
      isOrange ? 'calendar-cell-early' : '',
      isToday ? 'calendar-cell-today' : '',
      isSelected ? 'calendar-cell-selected' : '',
    ]
      .filter(Boolean)
      .join(' ')

    function handleClick() {
      setSelectedISO(info.dateISO)
      // In Monat/Woche liegt die Tagesgruppe schon im DOM (unabhängig von
      // der Auswahl) - direkt dorthin scrollen, kein Warten auf ein Rerender
      // nötig. Hat der Tag keine Termine, gibt es kein Ziel -> kein Scroll.
      if (viewMode === 'month' || viewMode === 'week') {
        document.getElementById(`cal-termin-${info.dateISO}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    return (
      <button key={info.dateISO} type="button" className={cellClass} onClick={handleClick}>
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
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Kalender</h1>
      </div>

      <section className="settings-section">
        <div className="calendar-mode-switch">
          {VIEW_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`calendar-mode-btn ${viewMode === m.key ? 'calendar-mode-btn-active' : ''}`}
              onClick={() => switchMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {viewMode === 'month' && (
          <>
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
              {monthDays.map(renderDayCell)}
            </div>
          </>
        )}

        {viewMode === 'week' && (
          <>
            <div className="month-nav calendar-nav">
              <button className="nav-btn" onClick={() => changeWeek(-1)} aria-label="Vorherige Woche">
                ‹
              </button>
              <strong>{weekLabel}</strong>
              <button className="nav-btn" onClick={() => changeWeek(1)} aria-label="Nächste Woche">
                ›
              </button>
            </div>

            <div className="calendar-weekday-row">
              {WEEKDAY_LABELS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="calendar-grid">{weekDays.map(renderDayCell)}</div>
          </>
        )}

        {viewMode === 'day' && (
          <div className="month-nav calendar-nav">
            <button className="nav-btn" onClick={() => changeDay(-1)} aria-label="Vorheriger Tag">
              ‹
            </button>
            <strong>
              {selectedDate.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </strong>
            <button className="nav-btn" onClick={() => changeDay(1)} aria-label="Nächster Tag">
              ›
            </button>
          </div>
        )}
      </section>

      <p className="calendar-legend">
        <span className="calendar-legend-dot" style={{ background: 'var(--home-bg)' }} />
        Zu Hause
        <span className="calendar-legend-dot" style={{ background: 'var(--flight-red-bg)' }} />
        Flugtag
      </p>

      {viewMode === 'day' ? (
        <section className="settings-section">
          <h2>
            {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </h2>

          {!selectedInfo.school && (
            <p className="status-warn">
              {selectedInfo.holiday ? `${selectedInfo.holiday} – keine Schule` : 'Kein Schultag'}
            </p>
          )}

          {extraSchoolDayLabel(selectedDate) && <p className="hint">{extraSchoolDayLabel(selectedDate)}</p>}

          {selectedIsAway && <p className="status-warn">🧳 Unterwegs</p>}
          {selectedIsOrange && selectedIsFlightDay && (
            <p className="status-warn">🟠 Umlauf beginnt heute (nach 09:00)</p>
          )}
          {selectedIsOrange && !selectedIsFlightDay && (
            <p className="status-warn">🟠 Früher Check-in am nächsten Tag (vor 09:00)</p>
          )}

          {selectedInfo.perKid.every((p) => p.recurring.length === 0 && p.oneOff.length === 0) ? (
            <p className="status-warn">Keine Termine an diesem Tag.</p>
          ) : (
            selectedInfo.perKid.map(({ kid, recurring, oneOff }) => {
              if (recurring.length === 0 && oneOff.length === 0) return null
              return (
                <div key={kid.id} className="calendar-day-kid">
                  <strong style={{ color: kid.color }}>{kid.name}</strong>
                  <ul className="kid-schedule-summary">
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
      ) : (
        <section className="settings-section">
          <h2>Termine {viewMode === 'month' ? monthLabel : weekLabel}</h2>

          {periodTermineDays.length === 0 ? (
            <p className="status-warn">Keine Termine in diesem Zeitraum.</p>
          ) : (
            periodTermineDays.map(({ date, info }) => (
              <div key={info.dateISO} id={`cal-termin-${info.dateISO}`} className="calendar-day-group">
                <h3 className="calendar-day-group-date">
                  {date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </h3>
                {info.perKid.map(({ kid, recurring, oneOff }) => {
                  if (recurring.length === 0 && oneOff.length === 0) return null
                  return (
                    <div key={kid.id} className="calendar-day-kid">
                      <strong style={{ color: kid.color }}>{kid.name}</strong>
                      <ul className="kid-schedule-summary">
                        {recurring.map((e, i) => (
                          <li key={`r${i}`}>{eventLine(e.title, e.time, e.endTime)}</li>
                        ))}
                        {oneOff.map((e, i) => (
                          <li key={`o${i}`}>{eventLine(e.reason, e.time, e.endTime)}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </section>
      )}
    </div>
  )
}
