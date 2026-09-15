import { useEffect, useState } from 'react'
import { HOLIDAYS } from '../lib/holidays.js'
import { KIDS, WEEKDAYS } from '../data/kids.js'
import TimeSelect from './TimeSelect.jsx'

function formatHolidayDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

export default function TermineView({ data, store, onOpenMonthOverview }) {
  return (
    <div className="view">
      <div className="view-header">
        <h1>Termine</h1>
      </div>

      <section className="settings-section">
        <h2>Ferien (keine Schule)</h2>
        <ul className="kid-schedule-summary">
          {HOLIDAYS.map((h) => (
            <li key={h.label}>
              {h.label}: {formatHolidayDate(h.start)} – {formatHolidayDate(h.end)}
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-section">
        <h2>Wiederkehrende Termine</h2>
        {KIDS.map((kid) => (
          <RecurringEventsForKid key={kid.id} kid={kid} data={data} store={store} />
        ))}
      </section>

      <section className="settings-section">
        <h2>Einmalige Termine</h2>
        <OneOffEvents data={data} store={store} />
      </section>

      <GardeCalendar />

      <section className="settings-section">
        <h2>Monatsübersicht</h2>
        <p className="status-warn">
          Alle Abholzeiten und wiederkehrenden Termine eines Monats als PDF (Querformat).
        </p>
        <button className="btn-small btn-primary" onClick={onOpenMonthOverview}>
          Monatsübersicht öffnen
        </button>
      </section>
    </div>
  )
}

function RecurringEventsForKid({ kid, data, store }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const events = Object.entries(data.recurringEvents?.[kid.id] ?? {}).sort(
    (a, b) => WEEKDAYS.indexOf(a[1].weekday) - WEEKDAYS.indexOf(b[1].weekday) || a[1].time.localeCompare(b[1].time),
  )

  return (
    <div className="recurring-kid-block">
      <strong style={{ color: kid.color }}>{kid.name}</strong>
      {events.length > 0 && (
        <ul className="kid-schedule-summary recurring-list">
          {events.map(([id, ev]) =>
            editingId === id ? (
              <li key={id}>
                <EventForm
                  initial={ev}
                  submitLabel="Speichern"
                  onSubmit={(value) => {
                    store.setRecurringEvent(kid.id, id, value)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={id} className="recurring-item">
                <span>
                  {ev.weekday}s {ev.time} – {ev.title}
                </span>
                <span className="recurring-item-actions">
                  <button
                    className="link-button"
                    aria-label={`${ev.title} bearbeiten`}
                    onClick={() => setEditingId(id)}
                  >
                    ✎
                  </button>
                  <button
                    className="link-button danger"
                    aria-label={`${ev.title} entfernen`}
                    onClick={() => store.removeRecurringEvent(kid.id, id)}
                  >
                    ×
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      {adding ? (
        <EventForm
          initial={{ weekday: WEEKDAYS[0], time: '16:00', title: '' }}
          submitLabel="Hinzufügen"
          onSubmit={(value) => {
            store.addRecurringEvent(kid.id, value)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button className="link-button" onClick={() => setAdding(true)}>
          + Termin hinzufügen
        </button>
      )}
    </div>
  )
}

function formatDateDMY(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function OneOffEvents({ data, store }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const events = Object.entries(data.oneOffEvents ?? {}).sort(
    (a, b) =>
      KIDS.findIndex((k) => k.id === a[1].kidId) - KIDS.findIndex((k) => k.id === b[1].kidId) ||
      a[1].date.localeCompare(b[1].date) ||
      a[1].time.localeCompare(b[1].time),
  )

  function kidOf(id) {
    return KIDS.find((k) => k.id === id)
  }

  return (
    <div className="recurring-kid-block">
      {events.length > 0 && (
        <ul className="kid-schedule-summary recurring-list">
          {events.map(([id, ev]) =>
            editingId === id ? (
              <li key={id}>
                <OneOffEventForm
                  initial={ev}
                  submitLabel="Speichern"
                  onSubmit={(value) => {
                    store.setOneOffEvent(id, value)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={id} className="recurring-item">
                <span>
                  <strong style={{ color: kidOf(ev.kidId)?.color }}>{kidOf(ev.kidId)?.name}</strong>{' '}
                  {formatDateDMY(ev.date)} {ev.time} – {ev.reason}
                </span>
                <span className="recurring-item-actions">
                  <button
                    className="link-button"
                    aria-label={`${ev.reason} bearbeiten`}
                    onClick={() => setEditingId(id)}
                  >
                    ✎
                  </button>
                  <button
                    className="link-button danger"
                    aria-label={`${ev.reason} entfernen`}
                    onClick={() => store.removeOneOffEvent(id)}
                  >
                    ×
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}

      {adding ? (
        <OneOffEventForm
          initial={{ kidId: KIDS[0].id, date: '', time: '16:00', reason: '' }}
          submitLabel="Hinzufügen"
          onSubmit={(value) => {
            store.addOneOffEvent(value)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button className="link-button" onClick={() => setAdding(true)}>
          + Termin hinzufügen
        </button>
      )}
    </div>
  )
}

function OneOffEventForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [kidId, setKidId] = useState(initial.kidId)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [reason, setReason] = useState(initial.reason)

  function submit() {
    const trimmed = reason.trim()
    if (!trimmed || !date || !time) return
    onSubmit({ kidId, date, time, reason: trimmed })
  }

  return (
    <div className="add-event-form">
      <div className="add-person-row">
        <select value={kidId} onChange={(e) => setKidId(e.target.value)}>
          {KIDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="add-person-row">
        <TimeSelect value={time} onChange={setTime} />
        <input
          type="text"
          placeholder="Grund (z.B. Zahnarzt)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="add-person-row">
        <button className="btn-small btn-primary" onClick={submit}>
          {submitLabel}
        </button>
        <button className="btn-small" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function EventForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [weekday, setWeekday] = useState(initial.weekday)
  const [time, setTime] = useState(initial.time)
  const [title, setTitle] = useState(initial.title)

  function submit() {
    const trimmed = title.trim()
    if (!trimmed || !time) return
    onSubmit({ weekday, time, title: trimmed })
  }

  return (
    <div className="add-event-form">
      <div className="add-person-row">
        <select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
          {WEEKDAYS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <TimeSelect value={time} onChange={setTime} />
      </div>
      <div className="add-person-row">
        <input
          type="text"
          placeholder="Termin (z.B. Klavier)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="btn-small btn-primary" onClick={submit}>
          {submitLabel}
        </button>
        <button className="btn-small" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function formatIcsEventDate(iso, allDay) {
  const d = new Date(iso)
  const dateLabel = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
  if (allDay) return dateLabel
  const timeLabel = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${dateLabel} ${timeLabel}`
}

function GardeCalendar() {
  const [state, setState] = useState({ loading: true, events: [], error: false })

  useEffect(() => {
    let cancelled = false
    fetch('/api/ics')
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setState({ loading: false, events: json.events ?? [], error: false })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, events: [], error: true })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="settings-section">
      <h2>Garde-Kalender</h2>
      {state.loading && <p className="status-warn">Lade Termine…</p>}
      {state.error && <p className="status-warn">Kalender konnte nicht geladen werden.</p>}
      {!state.loading && !state.error && state.events.length === 0 && (
        <p className="status-warn">Keine anstehenden Termine.</p>
      )}
      {state.events.length > 0 && (
        <ul className="kid-schedule-summary">
          {state.events.map((ev, i) => (
            <li key={i}>
              {formatIcsEventDate(ev.start, ev.allDay)} – {ev.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
