import { useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { HOLIDAYS } from '../lib/holidays.js'
import { KIDS, WEEKDAYS } from '../data/kids.js'
import TimeSelect from './TimeSelect.jsx'

function formatHolidayDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

export default function SettingsView({ data, store, synced, onOpenMonthOverview }) {
  return (
    <div className="view">
      <div className="view-header">
        <h1>Einstellungen</h1>
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
        <h2>Monatsübersicht</h2>
        <p className="status-warn">
          Alle Abholzeiten und wiederkehrenden Termine eines Monats als PDF (Querformat).
        </p>
        <button className="btn-small btn-primary" onClick={onOpenMonthOverview}>
          Monatsübersicht öffnen
        </button>
      </section>

      <section className="settings-section">
        <h2>Synchronisierung</h2>
        {synced ? (
          <p className="status-ok">✓ Verbunden – Änderungen werden auf allen Geräten synchronisiert.</p>
        ) : isFirebaseConfigured ? (
          <p className="status-warn">Verbindung wird aufgebaut…</p>
        ) : (
          <p className="status-warn">
            Nicht eingerichtet – Änderungen werden nur lokal in diesem Browser gespeichert. Siehe{' '}
            <code>FIREBASE_SETUP.md</code> im Projekt, um die Synchronisierung zwischen Geräten
            einzurichten.
          </p>
        )}
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
