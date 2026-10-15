import { useEffect, useState, useCallback, useRef } from 'react'
import { toISODate } from './dates.js'

// Daten liegen als ein JSON-Dokument in MySQL/MariaDB auf dem Webspace und
// werden über public/api/api.php gelesen und geschrieben.
const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.BASE_URL}api/api.php`
const POLL_MS = 5000

// Letzter bekannter Serverstand ({rev, data}) - damit die App sofort und auch
// offline mit den zuletzt gesehenen Daten startet.
const CACHE_KEY = 'familienplaner-cache'
// Noch nicht vom Server bestätigte Änderungen ([{path, value}]). Überleben ein
// Neuladen oder Beenden der App und werden nachgesendet, sobald der Server
// wieder erreichbar ist.
const PENDING_KEY = 'familienplaner-pending'
// Lokale Sicherung aus der Zeit vor der Server-Synchronisierung.
const LEGACY_KEY = 'familienplaner-data'

const DEFAULT_DATA = {
  people: ['Droste', 'Klein', 'Heyer', 'Sonstige'],
  assignments: {},
  exceptions: {},
  credentials: {},
  recurringEvents: {},
  oneOffEvents: {},
  flightDates: [],
  orangeDates: [],
  awayDates: [],
  landingDates: [],
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Speicher voll oder gesperrt: dann eben nur im Arbeitsspeicher
  }
}

// Setzt (oder löscht bei value === null) das Feld an einem Punkt-Pfad, ohne
// das Ausgangsobjekt zu verändern. Gleiche Semantik wie api.php.
function applyOp(doc, path, value) {
  const parts = path.split('.')
  const root = { ...doc }
  let node = root
  for (let i = 0; i < parts.length - 1; i++) {
    const child = node[parts[i]]
    if (child === null || typeof child !== 'object' || Array.isArray(child)) {
      if (value === null) return root
      node[parts[i]] = {}
    } else {
      node[parts[i]] = { ...child }
    }
    node = node[parts[i]]
  }
  const last = parts[parts.length - 1]
  if (value === null) delete node[last]
  else node[last] = value
  return root
}

function withPending(serverData, pending) {
  let doc = serverData
  for (const op of pending) doc = applyOp(doc, op.path, op.value)
  return { ...DEFAULT_DATA, ...doc }
}

export function assignmentKey(dateISO, kidId) {
  return `${dateISO}|${kidId}`
}

// Liefert {data, ready, synced, setAssignment, clearAssignment, setException, clearException, setPeople, ...}
export function useFamilyStore() {
  const [initial] = useState(() => {
    const cache = readJSON(CACHE_KEY, null)
    const pending = readJSON(PENDING_KEY, [])
    const base = cache ? cache.data : readJSON(LEGACY_KEY, {})
    return { cache, pending, data: withPending(base, pending) }
  })
  const serverRef = useRef(initial.cache)
  const pendingRef = useRef(initial.pending)
  const busyRef = useRef(false)

  const [data, setData] = useState(initial.data)
  const [ready, setReady] = useState(Boolean(initial.cache))
  const [synced, setSynced] = useState(false)

  const recompute = useCallback(() => {
    const base = serverRef.current?.data ?? readJSON(LEGACY_KEY, {})
    setData(withPending(base, pendingRef.current))
  }, [])

  const acceptServer = useCallback(
    (result) => {
      // Ältere Antworten (z. B. ein langsamer Abruf, der von einem Schreib-
      // vorgang überholt wurde) dürfen einen neueren Stand nicht überschreiben.
      if (serverRef.current && result.rev < serverRef.current.rev) return
      serverRef.current = { rev: result.rev, data: result.data }
      writeJSON(CACHE_KEY, serverRef.current)
      recompute()
    },
    [recompute],
  )

  // Sendet ausstehende Änderungen bzw. holt den aktuellen Stand.
  const sync = useCallback(async function run() {
    if (busyRef.current) return
    busyRef.current = true
    let ok = false
    try {
      const sending = pendingRef.current.slice()
      let result
      if (sending.length > 0) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ops: sending }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        result = await res.json()
        // Während der Anfrage neu hinzugekommene Änderungen bleiben stehen
        pendingRef.current = pendingRef.current.slice(sending.length)
        writeJSON(PENDING_KEY, pendingRef.current)
      } else {
        const since = serverRef.current?.rev ?? -1
        const res = await fetch(`${API_URL}?since=${since}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        result = await res.json()
      }
      if (!result.unchanged) acceptServer(result)
      ok = true
    } catch {
      // Offline oder Server nicht erreichbar: lokal weiterarbeiten, der
      // nächste Durchlauf (spätestens nach POLL_MS) versucht es erneut.
    } finally {
      busyRef.current = false
      setSynced(ok)
      setReady(true)
    }
    // Was während der Anfrage eingegeben wurde, gleich hinterherschicken
    if (ok && pendingRef.current.length > 0) run()
  }, [acceptServer])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') sync()
    }
    sync()
    const timer = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('online', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('online', tick)
      window.removeEventListener('focus', tick)
    }
  }, [sync])

  const write = useCallback(
    (path, value) => {
      pendingRef.current = [...pendingRef.current, { path, value }]
      writeJSON(PENDING_KEY, pendingRef.current)
      recompute()
      sync()
    },
    [recompute, sync],
  )

  const setAssignment = useCallback(
    (dateISO, kidId, value) => write(`assignments.${assignmentKey(dateISO, kidId)}`, value),
    [write],
  )

  const clearAssignment = useCallback(
    (dateISO, kidId) => write(`assignments.${assignmentKey(dateISO, kidId)}`, null),
    [write],
  )

  const setException = useCallback(
    (dateISO, kidId, value) => write(`exceptions.${assignmentKey(dateISO, kidId)}`, value),
    [write],
  )

  const clearException = useCallback(
    (dateISO, kidId) => write(`exceptions.${assignmentKey(dateISO, kidId)}`, null),
    [write],
  )

  const setPeople = useCallback((people) => write('people', people), [write])

  const setCredential = useCallback(
    (kidId, credential) => write(`credentials.${kidId}`, credential),
    [write],
  )

  const setRecurringEvent = useCallback(
    (kidId, id, event) => write(`recurringEvents.${kidId}.${id}`, event),
    [write],
  )

  const addRecurringEvent = useCallback(
    (kidId, event) => {
      const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
      setRecurringEvent(kidId, id, event)
    },
    [setRecurringEvent],
  )

  const removeRecurringEvent = useCallback(
    (kidId, id) => write(`recurringEvents.${kidId}.${id}`, null),
    [write],
  )

  const setOneOffEvent = useCallback((id, event) => write(`oneOffEvents.${id}`, event), [write])

  const addOneOffEvent = useCallback(
    (event) => {
      const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
      setOneOffEvent(id, event)
    },
    [setOneOffEvent],
  )

  const removeOneOffEvent = useCallback((id) => write(`oneOffEvents.${id}`, null), [write])

  // Abgelaufene einmalige Termine räumen sich von selbst auf, sobald ihr
  // (End-)Datum in der Vergangenheit liegt - keine manuelle Pflege nötig.
  // Termine ganz ohne Datum haben kein Ablaufdatum und bleiben stehen.
  useEffect(() => {
    if (!ready || !data) return
    const todayISO = toISODate(new Date())
    for (const [id, event] of Object.entries(data.oneOffEvents ?? {})) {
      const lastDate = event.endDate || event.date
      if (lastDate && lastDate < todayISO) removeOneOffEvent(id)
    }
  }, [ready, data, removeOneOffEvent])

  return {
    data,
    ready,
    synced,
    setAssignment,
    clearAssignment,
    setException,
    clearException,
    setPeople,
    setCredential,
    addRecurringEvent,
    setRecurringEvent,
    removeRecurringEvent,
    addOneOffEvent,
    setOneOffEvent,
    removeOneOffEvent,
  }
}
