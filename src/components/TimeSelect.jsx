const UNSET = '--'
const HOURS = [UNSET, ...Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))]
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

// Zwei <select>-Felder statt <input type="time">, damit die Uhrzeit immer im
// 24-Stunden-Format angezeigt wird - native Zeitfelder richten sich sonst nach
// der Geräte-Region und zeigen z.B. AM/PM statt europäischer Uhrzeiten.
// value === '' bedeutet "keine Uhrzeit angegeben" (Stunde zeigt "--").
export default function TimeSelect({ value, onChange, disabled = false }) {
  const [hh, mm] = value ? value.split(':') : [UNSET, '00']

  function changeHour(newHh) {
    onChange(newHh === UNSET ? '' : `${newHh}:${mm}`)
  }

  function changeMinute(newMm) {
    if (hh === UNSET) return
    onChange(`${hh}:${newMm}`)
  }

  return (
    <div className="time-select">
      <select value={hh} onChange={(e) => changeHour(e.target.value)} disabled={disabled} aria-label="Stunde">
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span>:</span>
      <select
        value={mm}
        onChange={(e) => changeMinute(e.target.value)}
        disabled={disabled || hh === UNSET}
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
