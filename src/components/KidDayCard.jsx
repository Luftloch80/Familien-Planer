import { useState } from 'react'
import { toISODate } from '../lib/dates.js'
import { resolvePickup } from '../lib/pickup.js'
import { EXCUSE_URL, FOOD_ORDER_URL } from '../data/kids.js'

export default function KidDayCard({ kid, date, data, store, compact = false, sameTime = null }) {
  const [open, setOpen] = useState(false)
  const result = resolvePickup(kid, date, data)
  const dateISO = toISODate(date)

  if (!result) return null

  const { options, chosenKey, time, label, person, exception } = result
  const timeClass = sameTime === true ? 'kid-time-same' : sameTime === false ? 'kid-time-diff' : ''
  const pin = data.credentials?.[kid.id]?.password

  return (
    <div className="kid-card" style={{ '--kid-color': kid.color }}>
      <div
        className="kid-card-summary"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen((o) => !o)}
      >
        <div className="kid-summary-row">
          <span className="kid-dot" />
          <span className="kid-name">{kid.name}</span>
          <a
            className="icon-btn"
            href={FOOD_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Essen bestellen"
            onClick={(e) => e.stopPropagation()}
          >
            🍽️
          </a>
          <a
            className="icon-btn"
            href={EXCUSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Krankmeldung"
            onClick={(e) => e.stopPropagation()}
          >
            🤒{pin && <span className="icon-btn-pin">{pin}</span>}
          </a>
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
      </div>

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

          <div className="field-row">
            <span className="field-label">Schüler entschuldigen</span>
            <a className="external-link-btn" href={EXCUSE_URL} target="_blank" rel="noopener noreferrer">
              🖊️ {kid.name} entschuldigen
            </a>
            {data.credentials?.[kid.id]?.username && (
              <span className="schedule-note">
                Login: {data.credentials[kid.id].username}
                {data.credentials[kid.id].password && ` / ${data.credentials[kid.id].password}`}
              </span>
            )}
          </div>
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
