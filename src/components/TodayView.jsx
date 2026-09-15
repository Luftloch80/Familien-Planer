import { KIDS } from '../data/kids.js'
import { weekdayName, addDays, formatShort } from '../lib/dates.js'
import { resolvePickup } from '../lib/pickup.js'
import KidDayCard from './KidDayCard.jsx'

export default function TodayView({ data, store }) {
  const now = new Date()
  let target = now
  let isWeekend = false
  if (!weekdayName(now)) {
    isWeekend = true
    // nächster Montag
    const offset = now.getDay() === 0 ? 1 : 2
    target = addDays(now, offset)
  }

  const weekday = weekdayName(target)
  const results = KIDS.map((kid) => ({ kid, result: resolvePickup(kid, target, data) })).sort(
    (a, b) => (a.result?.time ?? '').localeCompare(b.result?.time ?? ''),
  )

  return (
    <div className="view">
      <div className="view-header">
        <h1>{isWeekend ? 'Nächster Schultag' : 'Heute'}</h1>
        <p className="subtitle">
          {weekday}, {formatShort(target)}
        </p>
        {isWeekend && <p className="hint">Heute ist Wochenende – hier schon der Plan für Montag.</p>}
      </div>

      <div className="today-list">
        {results.map(({ kid }) => (
          <KidDayCard key={kid.id} kid={kid} date={target} data={data} store={store} />
        ))}
      </div>
    </div>
  )
}
