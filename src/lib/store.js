import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db, familyDocRef, isFirebaseConfigured } from './firebase.js'

const LOCAL_KEY = 'familienplaner-data'
const DEFAULT_DATA = {
  people: ['Droste', 'Klein', 'Heyer', 'Sonstige'],
  assignments: {},
  exceptions: {},
  credentials: {},
  recurringEvents: {},
  oneOffEvents: {},
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return DEFAULT_DATA
    return { ...DEFAULT_DATA, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_DATA
  }
}

function writeLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

export function assignmentKey(dateISO, kidId) {
  return `${dateISO}|${kidId}`
}

// Liefert {data, ready, synced, setAssignment, clearAssignment, setException, clearException, setPeople}
export function useFamilyStore() {
  const [data, setData] = useState(isFirebaseConfigured ? null : readLocal())
  const [ready, setReady] = useState(!isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onSnapshot(
      familyDocRef,
      (snap) => {
        // Nie ungefragt das ganze Dokument (neu) anlegen: ein leerer/fehlender
        // Snapshot kann auch nur eine leere Offline-Cache-Ansicht sein, obwohl
        // auf dem Server längst echte Daten liegen. Ein setDoc(DEFAULT_DATA)
        // hier hat genau das schon mehrfach gelöscht. Anlegen passiert nur
        // noch gezielt über persistField, wenn tatsächlich etwas gespeichert wird.
        if (snap.exists()) {
          setData({ ...DEFAULT_DATA, ...snap.data() })
        } else {
          setData(DEFAULT_DATA)
        }
        setReady(true)
      },
      () => {
        // Verbindung fehlgeschlagen -> lokal weiterarbeiten
        setData(readLocal())
        setReady(true)
      },
    )
    return unsub
  }, [])

  const persistField = useCallback(async (path, value) => {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(familyDocRef, { [path]: value })
      } catch {
        // updateDoc schlägt fehl, wenn das Dokument noch gar nicht existiert.
        // setDoc mit mergeFields schreibt garantiert NUR dieses eine Feld -
        // egal ob das Dokument neu angelegt oder schon voller anderer Daten
        // ist, nichts anderes wird angefasst oder überschrieben.
        const nested = {}
        const parts = path.split('.')
        let cur = nested
        for (let i = 0; i < parts.length - 1; i++) {
          cur[parts[i]] = {}
          cur = cur[parts[i]]
        }
        cur[parts[parts.length - 1]] = value
        try {
          await setDoc(familyDocRef, nested, { mergeFields: [path] })
        } catch {
          // weiterhin offline: lokaler Stand bleibt, nächster Schreibversuch holt es nach
        }
      }
    }
  }, [])

  const updateLocalAndMaybeRemote = useCallback(
    (updater, remotePath, remoteValue) => {
      setData((prev) => {
        const next = updater(prev ?? DEFAULT_DATA)
        if (!isFirebaseConfigured) writeLocal(next)
        return next
      })
      if (isFirebaseConfigured) persistField(remotePath, remoteValue)
    },
    [persistField],
  )

  const setAssignment = useCallback(
    (dateISO, kidId, value) => {
      const key = assignmentKey(dateISO, kidId)
      updateLocalAndMaybeRemote(
        (prev) => ({ ...prev, assignments: { ...prev.assignments, [key]: value } }),
        `assignments.${key}`,
        value,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const clearAssignment = useCallback(
    (dateISO, kidId) => {
      const key = assignmentKey(dateISO, kidId)
      updateLocalAndMaybeRemote(
        (prev) => {
          const next = { ...prev.assignments }
          delete next[key]
          return { ...prev, assignments: next }
        },
        `assignments.${key}`,
        null,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const setException = useCallback(
    (dateISO, kidId, value) => {
      const key = assignmentKey(dateISO, kidId)
      updateLocalAndMaybeRemote(
        (prev) => ({ ...prev, exceptions: { ...prev.exceptions, [key]: value } }),
        `exceptions.${key}`,
        value,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const clearException = useCallback(
    (dateISO, kidId) => {
      const key = assignmentKey(dateISO, kidId)
      updateLocalAndMaybeRemote(
        (prev) => {
          const next = { ...prev.exceptions }
          delete next[key]
          return { ...prev, exceptions: next }
        },
        `exceptions.${key}`,
        null,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const setPeople = useCallback(
    (people) => {
      updateLocalAndMaybeRemote((prev) => ({ ...prev, people }), 'people', people)
    },
    [updateLocalAndMaybeRemote],
  )

  const setCredential = useCallback(
    (kidId, credential) => {
      updateLocalAndMaybeRemote(
        (prev) => ({ ...prev, credentials: { ...prev.credentials, [kidId]: credential } }),
        `credentials.${kidId}`,
        credential,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const setRecurringEvent = useCallback(
    (kidId, id, event) => {
      updateLocalAndMaybeRemote(
        (prev) => ({
          ...prev,
          recurringEvents: {
            ...prev.recurringEvents,
            [kidId]: { ...prev.recurringEvents?.[kidId], [id]: event },
          },
        }),
        `recurringEvents.${kidId}.${id}`,
        event,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const addRecurringEvent = useCallback(
    (kidId, event) => {
      const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
      setRecurringEvent(kidId, id, event)
    },
    [setRecurringEvent],
  )

  const removeRecurringEvent = useCallback(
    (kidId, id) => {
      updateLocalAndMaybeRemote(
        (prev) => {
          const kidEvents = { ...prev.recurringEvents?.[kidId] }
          delete kidEvents[id]
          return { ...prev, recurringEvents: { ...prev.recurringEvents, [kidId]: kidEvents } }
        },
        `recurringEvents.${kidId}.${id}`,
        null,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const setOneOffEvent = useCallback(
    (id, event) => {
      updateLocalAndMaybeRemote(
        (prev) => ({ ...prev, oneOffEvents: { ...prev.oneOffEvents, [id]: event } }),
        `oneOffEvents.${id}`,
        event,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  const addOneOffEvent = useCallback(
    (event) => {
      const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
      setOneOffEvent(id, event)
    },
    [setOneOffEvent],
  )

  const removeOneOffEvent = useCallback(
    (id) => {
      updateLocalAndMaybeRemote(
        (prev) => {
          const next = { ...prev.oneOffEvents }
          delete next[id]
          return { ...prev, oneOffEvents: next }
        },
        `oneOffEvents.${id}`,
        null,
      )
    },
    [updateLocalAndMaybeRemote],
  )

  return {
    data: data ?? DEFAULT_DATA,
    ready,
    synced: isFirebaseConfigured,
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
