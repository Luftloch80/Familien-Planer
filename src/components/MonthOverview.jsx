import { useState } from 'react'
import { KIDS, pickupOptions } from '../data/kids.js'
import { weekdayName, toISODate } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Baut für jeden Tag des Monats eine Zeile: Datumsbezeichnung + pro Kind
// entweder "frei"/Ferien-Label oder die Abhol-Optionen + passende Termine.
// Wird sowohl für die Bildschirm-Tabelle als auch für den PDF-Export genutzt.
function buildRows(days, kids, data) {
  return days.map((date) => {
    const weekday = weekdayName(date)
    const holiday = holidayLabel(date)
    const school = isSchoolDay(date)
    const dateISO = toISODate(date)
    const dateLabel = `${date.toLocaleDateString('de-DE', { weekday: 'short' })} ${date.getDate()}.`
    const cells = kids.map((kid) => {
      const oneOff = Object.values(data.oneOffEvents ?? {}).filter(
        (ev) => ev.kidId === kid.id && ev.date === dateISO,
      )
      const oneOffLines = oneOff.map((e) => `${e.reason} ${e.time}`)

      if (!weekday) return { lines: oneOffLines, holiday: null }
      if (!school) return { lines: oneOffLines, holiday: holiday ?? 'frei' }

      const options = pickupOptions(kid, weekday, date)
      const recurring = Object.values(data.recurringEvents?.[kid.id] ?? {}).filter(
        (ev) => ev.weekday === weekday,
      )
      return {
        lines: [
          ...options.map((o) => `${o.label} ${o.time}`),
          ...recurring.map((e) => `${e.title} ${e.time}`),
          ...oneOffLines,
        ],
        holiday: null,
      }
    })
    return { dateLabel, cells, isWeekend: !weekday }
  })
}

export default function MonthOverview({ data, onClose }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [selectedKidIds, setSelectedKidIds] = useState(() => KIDS.map((k) => k.id))
  const [generating, setGenerating] = useState(false)

  function changeMonth(delta) {
    let m = monthIndex + delta
    let y = year
    if (m < 0) {
      m = 11
      y -= 1
    } else if (m > 11) {
      m = 0
      y += 1
    }
    setMonthIndex(m)
    setYear(y)
  }

  function toggleKid(id) {
    setSelectedKidIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    )
  }

  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  const days = Array.from({ length: daysInMonth(year, monthIndex) }, (_, i) => new Date(year, monthIndex, i + 1))
  const kids = KIDS.filter((k) => selectedKidIds.includes(k.id))
  const rows = buildRows(days, kids, data)

  async function showPdf() {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      doc.setFontSize(13)
      doc.text(`Monatsübersicht ${monthLabel}`, 12, 10)

      const pageWidth = doc.internal.pageSize.getWidth()
      const dateColWidth = 20
      const kidColWidth = (pageWidth - 24 - dateColWidth) / kids.length
      const columnStyles = { 0: { cellWidth: dateColWidth } }
      kids.forEach((_, i) => {
        columnStyles[i + 1] = { cellWidth: kidColWidth }
      })

      autoTable(doc, {
        startY: 15,
        margin: { left: 12, right: 12 },
        head: [['Datum', ...kids.map((k) => k.name)]],
        body: rows.map((r) => [
          r.dateLabel,
          ...r.cells.map((c) => [c.holiday, ...c.lines].filter(Boolean).join('\n')),
        ]),
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.2,
          valign: 'top',
          lineWidth: 0.15,
          lineColor: [180, 180, 180],
        },
        headStyles: { fillColor: [106, 90, 205] },
        columnStyles,
        didParseCell: (hookData) => {
          if (hookData.section === 'body' && rows[hookData.row.index]?.isWeekend) {
            hookData.cell.styles.fillColor = [245, 245, 245]
          }
        },
      })

      const url = URL.createObjectURL(doc.output('blob'))
      window.open(url, '_blank')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="month-overview">
      <div className="month-overview-toolbar no-print">
        <button className="btn-small" onClick={onClose}>
          ← Zurück
        </button>
        <div className="month-nav">
          <button className="nav-btn" onClick={() => changeMonth(-1)} aria-label="Vorheriger Monat">
            ‹
          </button>
          <strong>{monthLabel}</strong>
          <button className="nav-btn" onClick={() => changeMonth(1)} aria-label="Nächster Monat">
            ›
          </button>
        </div>
        <button className="btn-small btn-primary" onClick={showPdf} disabled={generating}>
          {generating ? 'Erstelle PDF…' : 'PDF anzeigen'}
        </button>
      </div>

      <div className="month-kid-picker no-print">
        {KIDS.map((kid) => (
          <label key={kid.id} className="month-kid-checkbox">
            <input
              type="checkbox"
              checked={selectedKidIds.includes(kid.id)}
              onChange={() => toggleKid(kid.id)}
            />
            <span style={{ color: kid.color }}>{kid.name}</span>
          </label>
        ))}
      </div>

      <table className="month-table">
        <thead>
          <tr>
            <th>Datum</th>
            {kids.map((kid) => (
              <th key={kid.id}>{kid.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={toISODate(days[i])} className={row.isWeekend ? 'month-row-weekend' : ''}>
              <td className="month-date-cell">{row.dateLabel}</td>
              {row.cells.map((cell, j) => (
                <td key={kids[j].id}>
                  {cell.holiday && <span className="month-holiday-cell">{cell.holiday}</span>}
                  {cell.lines.map((line, k) => (
                    <div key={k}>{line}</div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
