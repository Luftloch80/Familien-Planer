import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  doc,
} from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId)

let db = null
let familyDocRef = null

if (isFirebaseConfigured) {
  const app = initializeApp(cfg)
  // Persistenter Offline-Cache (IndexedDB): Eingaben, die ohne Netzverbindung
  // oder während eines kurzen Verbindungsabbruchs gemacht werden, landen erst
  // lokal und werden automatisch nachsynchronisiert, sobald die Verbindung
  // wieder da ist - sie überleben damit auch ein Neuladen der Seite oder ein
  // Beenden der App im Hintergrund, statt nur im flüchtigen Arbeitsspeicher
  // zu liegen und beim nächsten Laden verloren zu sein.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  })
  familyDocRef = doc(db, 'familienplaner', 'daten')
}

export { db, familyDocRef }
