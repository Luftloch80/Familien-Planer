import { useState } from 'react'
import { HOLIDAYS } from '../lib/holidays.js'
import { KIDS, WEEKDAYS } from '../data/kids.js'
import TimeSelect from './TimeSelect.jsx'

function formatHolidayDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

function formatDateDMY(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function dateRangeLabel(date, endDate) {
  if (!date) return ''
  if (endDate && endDate !== date) return `${formatDateDMY(date)}–${formatDateDMY(endDate)}`
  return formatDateDMY(date)
}

function timeRangeLabel(time, endTime) {
  if (!time) return ''
  if (endTime) return `${time}–${endTime}`
  return time
}

export default function TermineView({ data, store, onOpenMonthOverview }) {
  return (
    <div className="view">
      <div className="view-header">
        <h1>Termine</h1>
      </div>

      {KIDS.map((kid) => (
        <KidTermineDropdown key={kid.id} kid={kid} data={data} store={store} />
      ))}

      <section className="settings-section">
        <h2>Monatsübersicht</h2>
        <p className="status-warn">
          Alle Abholzeiten und wiederkehrenden Termine eines Monats als PDF (Querformat).
        </p>
        <button className="btn-small btn-primary" onClick={onOpenMonthOverview}>
          Monatsübersicht öffnen
        </button>
      </section>

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
    </div>
  )
}

function KidTermineDropdown({ kid, data, store }) {
  const [open, setOpen] = useState(false)
  const recurringCount = Object.keys(data.recurringEvents?.[kid.id] ?? {}).length
  const oneOffCount = Object.values(data.oneOffEvents ?? {}).filter((ev) => ev.kidId === kid.id).length
  const total = recurringCount + oneOffCount

  return (
    <section className="settings-section">
      <button
        type="button"
        className="termine-dropdown-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <strong style={{ color: kid.color }}>{kid.name}</strong>
        <span className="termine-dropdown-meta">
          {total} Termin{total === 1 ? '' : 'e'}
          <span className="termine-dropdown-arrow" aria-hidden="true">
            {open ? '▲' : '▼'}
          </span>
        </span>
      </button>

      {open && (
        <div className="termine-dropdown-body">
          <h3>Wiederkehrend</h3>
          <RecurringEventsForKid kid={kid} data={data} store={store} />

          <h3>Einmalig</h3>
          <OneOffEventsForKid kid={kid} data={data} store={store} />
        </div>
      )}
    </section>
  )
}

function RecurringEventsForKid({ kid, data, store }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const events = Object.entries(data.recurringEvents?.[kid.id] ?? {}).sort(
    (a, b) =>
      WEEKDAYS.indexOf(a[1].weekday) - WEEKDAYS.indexOf(b[1].weekday) ||
      (a[1].time || '99:99').localeCompare(b[1].time || '99:99'),
  )

  return (
    <div>
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
                  {ev.weekday}s{ev.time ? ` ${timeRangeLabel(ev.time, ev.endTime)}` : ''} – {ev.title}
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
          initial={{ weekday: WEEKDAYS[0], time: '', endTime: '', title: '' }}
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

function OneOffEventsForKid({ kid, data, store }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const events = Object.entries(data.oneOffEvents ?? {})
    .filter(([, ev]) => ev.kidId === kid.id)
    .sort(
      (a, b) =>
        (a[1].date || '9999-99-99').localeCompare(b[1].date || '9999-99-99') ||
        (a[1].time || '99:99').localeCompare(b[1].time || '99:99'),
    )

  return (
    <div>
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
                  {[dateRangeLabel(ev.date, ev.endDate), timeRangeLabel(ev.time, ev.endTime)]
                    .filter(Boolean)
                    .join(' ')}
                  {ev.date || ev.time ? ' – ' : ''}
                  {ev.reason}
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
          initial={{ date: '', endDate: '', time: '', endTime: '', reason: '' }}
          submitLabel="Hinzufügen"
          onSubmit={(value) => {
            store.addOneOffEvent({ ...value, kidId: kid.id })
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
  const [date, setDate] = useState(initial.date ?? '')
  const [endDate, setEndDate] = useState(initial.endDate ?? '')
  const [time, setTime] = useState(initial.time ?? '')
  const [endTime, setEndTime] = useState(initial.endTime ?? '')
  const [reason, setReason] = useState(initial.reason)

  function submit() {
    const trimmed = reason.trim()
    if (!trimmed) return
    onSubmit({
      ...initial,
      date,
      endDate: date ? endDate : '',
      time,
      endTime: time ? endTime : '',
      reason: trimmed,
    })
  }

  return (
    <div className="add-event-form">
      <div className="add-person-row">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TimeSelect value={time} onChange={setTime} />
      </div>
      <div className="add-person-row">
        <span className="form-inline-label">bis</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={!date} />
        <TimeSelect value={endTime} onChange={setEndTime} disabled={!time} />
      </div>
      <div className="add-person-row">
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
  const [time, setTime] = useState(initial.time ?? '')
  const [endTime, setEndTime] = useState(initial.endTime ?? '')
  const [title, setTitle] = useState(initial.title)

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({ weekday, time, endTime: time ? endTime : '', title: trimmed })
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
        <span className="form-inline-label">bis</span>
        <TimeSelect value={endTime} onChange={setEndTime} disabled={!time} />
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
