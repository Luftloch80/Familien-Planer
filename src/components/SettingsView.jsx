import { useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { HOLIDAYS } from '../lib/holidays.js'

function formatHolidayDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

export default function SettingsView({ data, store, synced }) {
  const [newName, setNewName] = useState('')

  function addPerson() {
    const name = newName.trim()
    if (!name || data.people.includes(name)) return
    store.setPeople([...data.people, name])
    setNewName('')
  }

  function removePerson(name) {
    store.setPeople(data.people.filter((p) => p !== name))
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Einstellungen</h1>
      </div>

      <section className="settings-section">
        <h2>Abholpersonen</h2>
        <div className="people-list">
          {data.people.map((p) => (
            <span key={p} className="chip chip-removable">
              {p}
              <button aria-label={`${p} entfernen`} onClick={() => removePerson(p)}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="add-person-row">
          <input
            type="text"
            placeholder="Name hinzufügen"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          />
          <button className="btn-small btn-primary" onClick={addPerson}>
            Hinzufügen
          </button>
        </div>
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
