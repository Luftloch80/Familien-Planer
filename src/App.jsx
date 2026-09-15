import { useState } from 'react'
import { useFamilyStore } from './lib/store.js'
import TodayView from './components/TodayView.jsx'
import TermineView from './components/TermineView.jsx'
import CalendarView from './components/CalendarView.jsx'
import './App.css'

const TABS = [
  { id: 'today', label: 'Schule', icon: '🏫' },
  { id: 'termine', label: 'Termine', icon: '📅' },
  { id: 'calendar', label: 'Kalender', icon: '🗓️' },
]

export default function App() {
  const [tab, setTab] = useState('today')
  const store = useFamilyStore()
  const { data, ready } = store

  if (!ready) {
    return (
      <div className="app-loading">
        <p>Lade Abholplan…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="app-content">
        {tab === 'today' && <TodayView data={data} store={store} />}
        {tab === 'termine' && <TermineView data={data} store={store} />}
        {tab === 'calendar' && <CalendarView data={data} />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'tab-btn-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
