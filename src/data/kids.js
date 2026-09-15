// Abholzeiten Schuljahr 2026/27, Freie Waldorfschule Gutenhalde
// Quelle: Stundenpläne der Kinder + Angaben der Eltern (Kernzeit-Anmeldung, AGs)
export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

export const KIDS = [
  {
    id: 'emma',
    name: 'Emma',
    klasse: '8. Klasse',
    color: '#7c6fd6',
    schedule: {
      Montag: { regular: '13:10' },
      Dienstag: { regular: '12:25' },
      Mittwoch: { regular: '11:35' },
      Donnerstag: { regular: '13:10' },
      Freitag: { regular: '13:10', ag: { label: 'Chor', time: '15:30' } },
    },
    kernzeit: null,
  },
  {
    id: 'charlotte',
    name: 'Charlotte',
    klasse: '3. Klasse',
    color: '#2f9e8f',
    schedule: {
      Montag: { regular: '12:25' },
      Dienstag: { regular: '11:35' },
      Mittwoch: { regular: '11:35' },
      Donnerstag: { regular: '12:25' },
      Freitag: { regular: '11:35' },
    },
    kernzeit: '13:10',
  },
  {
    id: 'rosi',
    name: 'Rosi',
    klasse: '2. Klasse',
    color: '#d67a3b',
    schedule: {
      Montag: { regular: '11:35' },
      Dienstag: { regular: '11:35' },
      Mittwoch: { regular: '11:35' },
      Donnerstag: { regular: '12:25' },
      Freitag: { regular: '12:25' },
    },
    kernzeit: '13:10',
  },
]

export function getKid(id) {
  return KIDS.find((k) => k.id === id)
}

// Alle Abhol-Optionen (Zeit + Bezeichnung) für ein Kind an einem Wochentag
export function pickupOptions(kid, weekday) {
  const day = kid.schedule[weekday]
  if (!day) return []
  const options = [{ key: 'regular', label: 'Schulschluss', time: day.regular }]
  if (day.ag) options.push({ key: 'ag', label: day.ag.label, time: day.ag.time })
  if (kid.kernzeit) options.push({ key: 'kernzeit', label: 'Kernzeit Abholung', time: kid.kernzeit })
  return options.sort((a, b) => a.time.localeCompare(b.time))
}
