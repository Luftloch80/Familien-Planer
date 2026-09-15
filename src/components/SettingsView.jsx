import { isFirebaseConfigured } from '../lib/firebase.js'

export default function SettingsView({ synced }) {
  return (
    <div className="view">
      <div className="view-header">
        <h1>Einstellungen</h1>
      </div>

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
