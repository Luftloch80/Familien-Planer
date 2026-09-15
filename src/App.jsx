import { useState } from 'react'
import { useFamilyStore } from './lib/store.js'
import TodayView from './components/TodayView.jsx'
import WeekView from './components/WeekView.jsx'
import SettingsView from './components/SettingsView.jsx'
import MonthOverview from './components/MonthOverview.jsx'
import './App.css'

const TABS = [
  { id: 'today', label: 'Heute', icon: '☀️' },
  { id: 'week', label: 'Woche', icon: '📅' },
  { id: 'settings', label: 'Einstellungen', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('today')
  const [showMonthOverview, setShowMonthOverview] = useState(false)
  const store = useFamilyStore()
  const { data, ready, synced } = store

  if (!ready) {
    return (
      <div className="app-loading">
        <p>Lade Abholplan…</p>
      </div>
    )
  }

  if (showMonthOverview) {
    return <MonthOverview data={data} onClose={() => setShowMonthOverview(false)} />
  }

  return (
    <div className="app">
      <main className="app-content">
        {tab === 'today' && <TodayView data={data} store={store} />}
        {tab === 'week' && <WeekView data={data} store={store} />}
        {tab === 'settings' && (
          <SettingsView
            data={data}
            store={store}
            synced={synced}
            onOpenMonthOverview={() => setShowMonthOverview(true)}
          />
        )}
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
