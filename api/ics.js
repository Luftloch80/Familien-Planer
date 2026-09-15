import ical from 'node-ical'

// Öffentliche iCal-Adresse des geteilten Google-Kalenders (aus dem Embed-Link
// abgeleitet: .../embed?src=<kalender-id> -> .../ical/<kalender-id>/public/basic.ics).
const ICS_URL =
  'https://calendar.google.com/calendar/ical/gruenegardefilderer%40gmail.com/public/basic.ics'
const HORIZON_DAYS = 90

export default async function handler(req, res) {
  try {
    const data = await ical.async.fromURL(ICS_URL)
    const from = new Date()
    const to = new Date(from.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000)

    const result = []
    for (const item of Object.values(data)) {
      if (item.type !== 'VEVENT') continue

      if (item.rrule) {
        const instances = ical.expandRecurringEvent(item, { from, to })
        for (const inst of instances) {
          result.push({
            title: inst.summary ?? '',
            start: inst.start.toISOString(),
            allDay: !!inst.isFullDay,
          })
        }
      } else if (item.start && item.start >= from && item.start <= to) {
        result.push({
          title: item.summary ?? '',
          start: item.start.toISOString(),
          allDay: !!item.start.dateOnly,
        })
      }
    }

    result.sort((a, b) => a.start.localeCompare(b.start))

    const components = Object.values(data)
    const debug = {
      totalComponents: components.length,
      totalVevents: components.filter((c) => c.type === 'VEVENT').length,
      recurringVevents: components.filter((c) => c.type === 'VEVENT' && c.rrule).length,
      horizonDays: HORIZON_DAYS,
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ events: result, debug })
  } catch (err) {
    res.status(502).json({ error: 'Kalender konnte nicht geladen werden', detail: String(err) })
  }
}
