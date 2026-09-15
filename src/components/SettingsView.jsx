import { useState } from 'react'
import { KIDS, EXCUSE_URL } from '../data/kids.js'
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
        <h2>Stundenpläne</h2>
        <ul className="kid-schedule-summary">
          {KIDS.map((kid) => (
            <li key={kid.id}>
              <strong style={{ color: kid.color }}>{kid.name}</strong> ({kid.klasse}) –{' '}
              {Object.entries(kid.schedule)
                .map(([day, s]) => `${day.slice(0, 2)} ${s.regular}`)
                .join(' · ')}
              {kid.kernzeit && ` · Kernzeit bis ${kid.kernzeit}`}
              {Object.entries(kid.schedule).map(
                ([day, s]) =>
                  s.biweekly && (
                    <span key={day} className="schedule-note">
                      {' '}
                      · {s.biweekly.label} jede 2. Woche ({day}s) bis {s.biweekly.time}
                    </span>
                  ),
              )}
              {kid.rotation && (
                <span className="schedule-note">
                  {' '}
                  · {Object.keys(kid.rotation.overrides).join('/')} variieren im 3-Wochen-Rhythmus
                  (Werken/Handarbeit/Gartenbau) – genaue Zeit siehe Heute-/Wochenansicht
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-section">
        <h2>Zugangsdaten Schüler-Entschuldigung</h2>
        <p className="status-warn">
          Für <a href={EXCUSE_URL} target="_blank" rel="noopener noreferrer">gutenhalde.de/schueler-entschuldigen</a>.
          Wird über eure Firebase-Datenbank synchronisiert, nicht im Programmcode gespeichert.
        </p>
        {KIDS.map((kid) => (
          <CredentialRow key={kid.id} kid={kid} data={data} store={store} />
        ))}
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

function CredentialRow({ kid, data, store }) {
  const stored = data.credentials?.[kid.id] ?? {}
  const [username, setUsername] = useState(stored.username ?? '')
  const [password, setPassword] = useState(stored.password ?? '')

  function save() {
    store.setCredential(kid.id, { username, password })
  }

  return (
    <div className="add-person-row">
      <strong style={{ color: kid.color, minWidth: '5.5em' }}>{kid.name}</strong>
      <input
        type="text"
        placeholder="Benutzername"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onBlur={save}
      />
      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={save}
      />
    </div>
  )
}
