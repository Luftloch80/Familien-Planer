import { initializeApp } from 'firebase/app'
import { getFirestore, doc } from 'firebase/firestore'

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
  db = getFirestore(app)
  familyDocRef = doc(db, 'familienplaner', 'daten')
}

export { db, familyDocRef }
