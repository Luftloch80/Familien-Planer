import { useState } from 'react'
import { KIDS, pickupOptions } from '../data/kids.js'
import { weekdayName, toISODate, startOfWeek, addDays } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// Baut aus Titel + optionaler Start-/Enduhrzeit eine Anzeigezeile, z.B.
// "Zahnarzt 14:00–15:00", "Zahnarzt 14:00" oder nur "Zahnarzt" ohne Uhrzeit.
function eventLine(title, time, endTime) {
  if (!time) return title
  return `${title} ${time}${endTime ? `–${endTime}` : ''}`
}

// Nur als Text statt Farbe, da der Drucker schwarz-weiß ist: "Frei" (zu
// Hause), "Flugtag" (Flug oder Layover unterwegs) und "Anreise" für
// Übergangstage (früher Check-in am Folgetag oder Umlauf-Start heute).
function dutyLabel(dateISO, data) {
  const isOrange = (data.orangeDates ?? []).includes(dateISO)
  if (isOrange) return 'Anreise'
  const isFlight = (data.flightDates ?? []).includes(dateISO)
  const isAway = (data.awayDates ?? []).includes(dateISO)
  if (isFlight || isAway) return 'Flugtag'
  return 'Frei'
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
      // Mehrtägige Termine (date...endDate) erscheinen an jedem Tag im Zeitraum.
      // Termine ganz ohne Datum lassen sich keinem Tag zuordnen und fehlen hier.
      const oneOff = Object.values(data.oneOffEvents ?? {}).filter(
        (ev) => ev.kidId === kid.id && ev.date && dateISO >= ev.date && dateISO <= (ev.endDate || ev.date),
      )
      const oneOffLines = oneOff.map((e) => eventLine(e.reason, e.time, e.endTime))

      if (!weekday) return { lines: oneOffLines, holiday: null }
      if (!school) return { lines: oneOffLines, holiday: holiday ?? 'frei' }

      const options = pickupOptions(kid, weekday, date)
      const recurring = Object.values(data.recurringEvents?.[kid.id] ?? {}).filter(
        (ev) => ev.weekday === weekday,
      )
      return {
        lines: [
          ...options.map((o) => `${o.label} ${o.time}`),
          ...recurring.map((e) => eventLine(e.title, e.time, e.endTime)),
          ...oneOffLines,
        ],
        holiday: null,
      }
    })
    return { dateLabel, cells, isWeekend: !weekday, duty: dutyLabel(dateISO, data) }
  })
}

export default function MonthOverview({ data }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [selectedKidIds, setSelectedKidIds] = useState(() => KIDS.map((k) => k.id))
  const [showDuty, setShowDuty] = useState(true)
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

  // Volle Kalenderwochen (Mo-So), auch wenn dafür Tage aus dem Vor- oder
  // Folgemonat mit reinragen - kein Block zeigt eine angeschnittene Woche.
  const firstOfMonth = new Date(year, monthIndex, 1)
  const lastOfMonth = new Date(year, monthIndex, daysInMonth(year, monthIndex))
  const rangeStart = startOfWeek(firstOfMonth)
  const rangeEnd = addDays(startOfWeek(lastOfMonth), 6)
  const totalRangeDays = Math.round((rangeEnd - rangeStart) / 86400000) + 1
  const days = Array.from({ length: totalRangeDays }, (_, i) => addDays(rangeStart, i))
  const kids = KIDS.filter((k) => selectedKidIds.includes(k.id))
  const rows = buildRows(days, kids, data)

  function isoWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = (d.getUTCDay() + 6) % 7
    d.setUTCDate(d.getUTCDate() - dayNum + 3)
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
    const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3)
    return 1 + Math.round((d - firstThursday) / (7 * 86400000))
  }

  // Höchstens 3 Zeilen pro Zelle, sonst "+N weitere" - so bleibt die
  // Zeilenhöhe vorhersehbar und die 4 Blöcke sprengen die Seite nicht.
  function capLines(lines) {
    if (lines.length <= 3) return lines.join('\n')
    const shown = lines.slice(0, 2)
    shown.push(`+${lines.length - 2} weitere`)
    return shown.join('\n')
  }

  async function showPdf() {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      doc.setFontSize(14)
      doc.text(`Monatsübersicht ${monthLabel}`, 148, 12, { align: 'center' })

      // Immer volle Kalenderwochen (7 Tage) - dank der Wochen-Ausrichtung
      // von `days` oben ist die Gesamtlänge immer ein Vielfaches von 7.
      const blocks = []
      for (let i = 0; i < days.length; i += 7) {
        const weekDays = days.slice(i, i + 7)
        blocks.push({
          weekNum: isoWeekNumber(weekDays[0]),
          days: weekDays,
          rows: rows.slice(i, i + 7),
        })
      }

      const cols = 2
      const gutter = 6
      const marginLeft = 8
      const marginTop = 18
      const usableWidth = doc.internal.pageSize.getWidth() - marginLeft * 2
      const usableHeight = doc.internal.pageSize.getHeight() - marginTop - 6
      const blockWidth = (usableWidth - gutter * (cols - 1)) / cols
      const rowsOfBlocks = Math.ceil(blocks.length / cols)
      const blockHeight = (usableHeight - gutter * (rowsOfBlocks - 1)) / rowsOfBlocks

      // Alle Spalten (Datum, jedes Kind, Dienstplan) gleich breit.
      const totalCols = 1 + kids.length + (showDuty ? 1 : 0)
      const equalColWidth = blockWidth / totalCols
      const columnStyles = {}
      for (let c = 0; c < totalCols; c++) columnStyles[c] = { cellWidth: equalColWidth }

      // Zeilenhöhe hängt vom verfügbaren Platz ab (mehr Wochen -> mehr
      // Blockreihen -> weniger Höhe pro Block), damit es immer auf eine
      // Seite passt, egal ob der Monat 4, 5 oder 6 Wochen umfasst.
      const headerHeight = 4
      // 8% Sicherheitsabschlag, da autoTable Zeilen bei minimaler Abweichung
      // sonst komplett auf die nächste Seite schiebt statt leicht zu überlappen.
      const bodyRowHeight = ((blockHeight - headerHeight) / 7) * 0.92
      const bodyFontSize = Math.max(5, Math.min(6, bodyRowHeight * 0.62))

      blocks.forEach((block, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = marginLeft + col * (blockWidth + gutter)
        const y = marginTop + row * (blockHeight + gutter)
        const first = block.days[0]
        const last = block.days[6]
        const rangeLabel =
          first.getMonth() === last.getMonth()
            ? `${first.getDate()}.–${last.getDate()}.${last.getMonth() + 1}.`
            : `${first.getDate()}.${first.getMonth() + 1}.–${last.getDate()}.${last.getMonth() + 1}.`

        doc.setFontSize(9)
        doc.text(`KW ${block.weekNum} · ${rangeLabel}`, x, y - 2)

        autoTable(doc, {
          startY: y,
          margin: {
            left: x,
            right: doc.internal.pageSize.getWidth() - x - blockWidth,
            bottom: doc.internal.pageSize.getHeight() - (y + blockHeight),
          },
          tableWidth: blockWidth,
          pageBreak: 'avoid',
          head: [['Datum', ...kids.map((k) => k.name), ...(showDuty ? ['Dienst'] : [])]],
          body: block.rows.map((r, j) => {
            const outsideMonth = block.days[j].getMonth() !== monthIndex
            const dateLabel = outsideMonth ? `${r.dateLabel}${block.days[j].getMonth() + 1}.` : r.dateLabel
            return [
              dateLabel,
              ...r.cells.map((c) => capLines([c.holiday, ...c.lines].filter(Boolean))),
              ...(showDuty ? [r.duty] : []),
            ]
          }),
          theme: 'grid',
          styles: {
            fontSize: bodyFontSize,
            cellPadding: 0.8,
            valign: 'top',
            lineWidth: 0.25,
            lineColor: [90, 90, 90],
            minCellHeight: bodyRowHeight,
          },
          headStyles: {
            fillColor: [106, 90, 205],
            fontSize: bodyFontSize,
            lineWidth: 0.25,
            lineColor: [90, 90, 90],
            minCellHeight: headerHeight,
          },
          columnStyles,
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && block.rows[hookData.row.index]?.isWeekend) {
              hookData.cell.styles.fillColor = [245, 245, 245]
            }
            if (hookData.section === 'body' && block.days[hookData.row.index]?.getMonth() !== monthIndex) {
              hookData.cell.styles.textColor = [150, 150, 150]
            }
          },
        })
      })

      const url = URL.createObjectURL(doc.output('blob'))
      window.open(url, '_blank')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <div className="month-nav">
        <button className="nav-btn" onClick={() => changeMonth(-1)} aria-label="Vorheriger Monat">
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button className="nav-btn" onClick={() => changeMonth(1)} aria-label="Nächster Monat">
          ›
        </button>
      </div>

      <div className="month-kid-picker">
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
        <label className="month-kid-checkbox">
          <input type="checkbox" checked={showDuty} onChange={() => setShowDuty((s) => !s)} />
          <span>Dienstplan</span>
        </label>
      </div>

      <button className="btn-small btn-primary" onClick={showPdf} disabled={generating}>
        {generating ? 'Erstelle PDF…' : 'PDF erstellen'}
      </button>
    </>
  )
}
