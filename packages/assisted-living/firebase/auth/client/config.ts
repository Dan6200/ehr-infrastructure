import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

const appName = 'lean-ehr-assisted-living-client'
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
}

let databaseId: string | undefined = undefined
if (process.env.VERCEL_ENV === 'preview') {
  databaseId = 'staging'
}

if (!getApps().find((app) => app?.name === appName))
  initializeApp(firebaseConfig, appName)

export const analytics = (async () => {
  if (await isSupported()) return getAnalytics(getApp(appName))
  return null
})()

export const auth = getAuth(getApp(appName))
export const db = databaseId
  ? getFirestore(getApp(appName), databaseId)
  : getFirestore(getApp(appName))

// Connect to Firestore Emulator in development
if (process.env.NODE_ENV === 'development') {
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST
  const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT
  const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!

  connectFirestoreEmulator(db, firestoreHost!, Number(firestorePort!))
  connectAuthEmulator(auth, authHost)
  console.log('Client: Connected to Firestore and Auth emulators!')
}
