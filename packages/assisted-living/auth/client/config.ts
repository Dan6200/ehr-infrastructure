import { getAuth, Auth } from 'firebase/auth'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const appName = 'lean-ehr-assisted-living-client'
import { firebaseConfig } from '@/firebase/config'

let databaseId: string | undefined = undefined
if (process.env.VERCEL_ENV === 'preview') {
  databaseId = 'staging'
}

// Initialize Firebase client app only in the browser environment
let clientApp = getApps().find((app) => app?.name === appName)
if (typeof window !== 'undefined' && !clientApp) {
  clientApp = initializeApp(firebaseConfig, appName)
}

export const analytics = (async () => {
  if (typeof window !== 'undefined' && (await isSupported()))
    return getAnalytics(getApp(appName))
  return null
})()

export let auth: Auth | null = null,
  db: Firestore | null = null

if (typeof window !== 'undefined') {
  auth = getAuth(getApp(appName))
  db = databaseId
    ? getFirestore(getApp(appName), databaseId)
    : getFirestore(getApp(appName))
}

// Connect to Firestore Emulator in development
// if (process.env.NODE_ENV === 'development') {
//   const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST
//   const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT
//   const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!

//   if (typeof window !== 'undefined' && auth && db) {
//     connectFirestoreEmulator(db, firestoreHost!, Number(firestorePort!))
//     connectAuthEmulator(auth, authHost)
//     console.log('Client: Connected to Firestore and Auth emulators!')
//   }
// }

// Register the service workers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/auth-service-worker.js', { scope: '/' })
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope)
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error)
    })
}
