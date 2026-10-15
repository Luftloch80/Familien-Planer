// Überträgt das Firestore-Dokument familienplaner/daten einmalig in die neue
// Datenbank auf dem Webspace.
//
//   FIREBASE_PROJECT_ID=... FIREBASE_API_KEY=... SITE_URL=https://planer.example.de \
//     node scripts/migrate-from-firebase.mjs
//
// Bricht ab, wenn die neue Datenbank schon Daten enthält (FORCE=1 überschreibt
// dann die aus Firebase stammenden Felder trotzdem).

const { FIREBASE_PROJECT_ID, FIREBASE_API_KEY, SITE_URL, FORCE } = process.env
if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY || !SITE_URL) {
  console.error('FIREBASE_PROJECT_ID, FIREBASE_API_KEY und SITE_URL müssen gesetzt sein.')
  process.exit(1)
}

const FIRESTORE_URL =
  process.env.FIRESTORE_URL ??
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/familienplaner/daten?key=${FIREBASE_API_KEY}`
const API_URL = new URL('api/api.php', SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`).href

// Firestore-REST liefert typisierte Werte ({stringValue: ...}) - zurück in JSON
function fromFirestore(value) {
  if ('nullValue' in value) return null
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('stringValue' in value) return value.stringValue
  if ('timestampValue' in value) return value.timestampValue
  if ('referenceValue' in value) return value.referenceValue
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromFirestore)
  if ('mapValue' in value) return fieldsToObject(value.mapValue.fields ?? {})
  throw new Error(`Unbekannter Firestore-Typ: ${Object.keys(value).join(', ')}`)
}

function fieldsToObject(fields) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromFirestore(v)]))
}

const fsRes = await fetch(FIRESTORE_URL)
if (!fsRes.ok) {
  console.error(`Firestore-Abruf fehlgeschlagen: HTTP ${fsRes.status}\n${await fsRes.text()}`)
  process.exit(1)
}
const data = fieldsToObject((await fsRes.json()).fields ?? {})
console.log(`Aus Firebase gelesen: ${Object.keys(data).join(', ') || '(leer)'}`)

const current = await (await fetch(API_URL)).json()
if (current.rev > 0 && Object.keys(current.data ?? {}).length > 0 && FORCE !== '1') {
  console.log(
    `Die neue Datenbank enthält schon Daten (rev ${current.rev}) - Übernahme übersprungen, damit nichts überschrieben wird.`,
  )
  process.exit(0)
}

const ops = Object.entries(data).map(([path, value]) => ({ path, value }))
const res = await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ops }),
})
if (!res.ok) {
  console.error(`Schreiben fehlgeschlagen: HTTP ${res.status}\n${await res.text()}`)
  process.exit(1)
}
const result = await res.json()
console.log(`Fertig: ${ops.length} Felder übernommen, neue Revision ${result.rev}.`)
