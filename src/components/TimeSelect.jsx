const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

// Zwei <select>-Felder statt <input type="time">, damit die Uhrzeit immer im
// 24-Stunden-Format angezeigt wird - native Zeitfelder richten sich sonst nach
// der Geräte-Region und zeigen z.B. AM/PM statt europäischer Uhrzeiten.
export default function TimeSelect({ value, onChange }) {
  const [hh, mm] = value.split(':')

  return (
    <div className="time-select">
      <select value={hh} onChange={(e) => onChange(`${e.target.value}:${mm}`)} aria-label="Stunde">
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span>:</span>
      <select value={mm} onChange={(e) => onChange(`${hh}:${e.target.value}`)} aria-label="Minute">
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
