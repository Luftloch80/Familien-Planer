import { useState } from 'react'
import { KIDS } from '../data/kids.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

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
        <h2>Stundenpläne</h2>
        <ul className="kid-schedule-summary">
          {KIDS.map((kid) => (
            <li key={kid.id}>
              <strong style={{ color: kid.color }}>{kid.name}</strong> ({kid.klasse}) –{' '}
              {Object.entries(kid.schedule)
                .map(([day, s]) => `${day.slice(0, 2)} ${s.regular}`)
                .join(' · ')}
              {kid.kernzeit && ` · Kernzeit bis ${kid.kernzeit}`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
