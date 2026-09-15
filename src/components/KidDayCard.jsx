import { useState } from 'react'
import { toISODate } from '../lib/dates.js'
import { resolvePickup } from '../lib/pickup.js'

export default function KidDayCard({ kid, date, data, store, compact = false, sameTime = null }) {
  const [open, setOpen] = useState(false)
  const result = resolvePickup(kid, date, data)
  const dateISO = toISODate(date)

  if (!result) return null

  const { options, chosenKey, time, label, person, exception } = result
  const timeClass = sameTime === true ? 'kid-time-same' : sameTime === false ? 'kid-time-diff' : ''

  return (
    <div className="kid-card" style={{ '--kid-color': kid.color }}>
      <button className="kid-card-summary" onClick={() => setOpen((o) => !o)}>
        <div className="kid-summary-row">
          <span className="kid-dot" />
          <span className="kid-name">{kid.name}</span>
          <span className={`kid-time ${timeClass}`}>
            {time ?? '–'}
            {exception?.time && <span className="badge">Ausnahme</span>}
          </span>
        </div>
        <div className="kid-summary-row">
          <span className="kid-label">{label}</span>
          <span className={`kid-person ${person ? '' : 'kid-person-empty'}`}>
            {person ?? 'wer holt ab?'}
          </span>
          <span className="chevron">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && !compact && (
        <div className="kid-card-detail">
          <div className="field-row">
            <span className="field-label">Abholung</span>
            <div className="option-chips">
              {options.map((opt) => (
                <button
                  key={opt.key}
                  className={`chip ${chosenKey === opt.key ? 'chip-active' : ''}`}
                  onClick={() =>
                    store.setAssignment(dateISO, kid.id, {
                      ...(data.assignments[`${dateISO}|${kid.id}`] ?? {}),
                      option: opt.key,
                    })
                  }
                >
                  {opt.label} {opt.time}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <span className="field-label">Wer holt ab</span>
            <div className="option-chips">
              {data.people.map((p) => (
                <button
                  key={p}
                  className={`chip ${person === p ? 'chip-active' : ''}`}
                  onClick={() =>
                    store.setAssignment(dateISO, kid.id, {
                      ...(data.assignments[`${dateISO}|${kid.id}`] ?? {}),
                      person: person === p ? null : p,
                    })
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <ExceptionEditor
            dateISO={dateISO}
            kidId={kid.id}
            exception={exception}
            store={store}
          />
        </div>
      )}
    </div>
  )
}

function ExceptionEditor({ dateISO, kidId, exception, store }) {
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(exception?.time ?? '')
  const [note, setNote] = useState(exception?.note ?? '')

  if (!editing && !exception) {
    return (
      <button className="link-button" onClick={() => setEditing(true)}>
        + Ausnahme für diesen Tag eintragen
      </button>
    )
  }

  if (!editing && exception) {
    return (
      <div className="exception-summary">
        <span>
          Ausnahme: {exception.time} {exception.note && `– ${exception.note}`}
        </span>
        <button
          className="link-button"
          onClick={() => {
            setTime(exception.time ?? '')
            setNote(exception.note ?? '')
            setEditing(true)
          }}
        >
          bearbeiten
        </button>
        <button className="link-button danger" onClick={() => store.clearException(dateISO, kidId)}>
          entfernen
        </button>
      </div>
    )
  }

  return (
    <div className="exception-editor">
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        aria-label="Abweichende Abholzeit"
      />
      <input
        type="text"
        placeholder="Notiz (z.B. Zahnarzt, AG fällt aus)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="exception-editor-actions">
        <button
          className="btn-small btn-primary"
          disabled={!time}
          onClick={() => {
            store.setException(dateISO, kidId, { time, note })
            setEditing(false)
          }}
        >
          Speichern
        </button>
        <button className="btn-small" onClick={() => setEditing(false)}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}
