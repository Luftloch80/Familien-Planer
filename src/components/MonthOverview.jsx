import { useState } from 'react'
import { KIDS, pickupOptions } from '../data/kids.js'
import { weekdayName, toISODate, startOfWeek, addDays } from '../lib/dates.js'
import { isSchoolDay, holidayLabel } from '../lib/holidays.js'

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

// Baut für jeden Tag eine Zeile: Datumsbezeichnung + pro Kind entweder
// "frei"/Ferien-Label oder die Abhol-Optionen + passende Termine.
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

export default function MonthOverview({ data }) {
  // Kein Monatsbezug und keine Navigation: immer genau die 4 vollen
  // Kalenderwochen (Mo-So), die die aktuelle Woche enthalten.
  const anchorMonday = startOfWeek(new Date())
  const [selectedKidIds, setSelectedKidIds] = useState(() => KIDS.map((k) => k.id))
  const [showDuty, setShowDuty] = useState(true)
  const [generating, setGenerating] = useState(false)

  function toggleKid(id) {
    setSelectedKidIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    )
  }

  const days = Array.from({ length: 28 }, (_, i) => addDays(anchorMonday, i))
  const kids = KIDS.filter((k) => selectedKidIds.includes(k.id))
  const rows = buildRows(days, kids, data)

  const rangeLabel = `${days[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} – ${days[27].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  const weekRangeLabel = `KW ${isoWeekNumber(days[0])}–${isoWeekNumber(days[27])}`

  async function showPdf() {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      doc.setFontSize(14)
      doc.text(`Aktueller KW Block · ${rangeLabel}`, 148, 12, { align: 'center' })

      // Immer genau 4 Blöcke à 7 Tage, da `days` schon exakt 4 volle Wochen ist.
      const blocks = [0, 1, 2, 3].map((i) => ({
        days: days.slice(i * 7, i * 7 + 7),
        rows: rows.slice(i * 7, i * 7 + 7),
      }))

      const cols = 2
      const gutter = 6
      const marginLeft = 8
      const marginTop = 18
      const usableWidth = doc.internal.pageSize.getWidth() - marginLeft * 2
      const usableHeight = doc.internal.pageSize.getHeight() - marginTop - 6
      const blockWidth = (usableWidth - gutter * (cols - 1)) / cols
      const blockHeight = (usableHeight - gutter) / 2

      // Alle Spalten (Datum, jedes Kind, Dienstplan) gleich breit.
      const totalCols = 1 + kids.length + (showDuty ? 1 : 0)
      const equalColWidth = blockWidth / totalCols
      const columnStyles = {}
      for (let c = 0; c < totalCols; c++) columnStyles[c] = { cellWidth: equalColWidth }
      // Datum-Spalte (0) größer, fett und (anders als der Rest, der oben
      // ausgerichtet ist) auch vertikal mittig in der Zelle zentriert.
      columnStyles[0] = { ...columnStyles[0], fontSize: 7.5, fontStyle: 'bold', valign: 'middle' }

      // Feste, bereits erprobte Werte statt dynamischer Skalierung: bei größerer
      // Schrift kann Text in den schmalen gleich breiten Spalten umbrechen und
      // damit die für die Blockhöhe angenommene Zeilenzahl sprengen.
      const headerHeight = 5
      const bodyFontSize = 6
      const bodyCellPadding = 0.8
      const bodyRowHeight = ((blockHeight - headerHeight) / 7) * 0.85

      blocks.forEach((block, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = marginLeft + col * (blockWidth + gutter)
        const y = marginTop + row * (blockHeight + gutter)

        autoTable(doc, {
          startY: y,
          margin: {
            left: x,
            right: doc.internal.pageSize.getWidth() - x - blockWidth,
            bottom: doc.internal.pageSize.getHeight() - (y + blockHeight),
          },
          tableWidth: blockWidth,
          head: [['Datum', ...kids.map((k) => k.name), ...(showDuty ? ['Dienst'] : [])]],
          body: block.rows.map((r) => [
            r.dateLabel,
            ...r.cells.map((c) => capLines([c.holiday, ...c.lines].filter(Boolean))),
            ...(showDuty ? [r.duty] : []),
          ]),
          theme: 'grid',
          styles: {
            fontSize: bodyFontSize,
            cellPadding: bodyCellPadding,
            valign: 'top',
            halign: 'center',
            lineWidth: 0.25,
            lineColor: [90, 90, 90],
            minCellHeight: bodyRowHeight,
          },
          headStyles: {
            fillColor: [106, 90, 205],
            fontSize: bodyFontSize,
            halign: 'center',
            lineWidth: 0.25,
            lineColor: [90, 90, 90],
            minCellHeight: headerHeight,
          },
          columnStyles,
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && block.rows[hookData.row.index]?.isWeekend) {
              hookData.cell.styles.fillColor = [245, 245, 245]
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
        {generating ? 'Erstelle PDF…' : `PDF erstellen · ${weekRangeLabel} (${rangeLabel})`}
      </button>
    </>
  )
}
