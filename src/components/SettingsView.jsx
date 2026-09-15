import { isFirebaseConfigured } from '../lib/firebase.js'
import { HOLIDAYS } from '../lib/holidays.js'

function formatHolidayDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y.slice(2)}`
}

export default function SettingsView({ synced }) {
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
