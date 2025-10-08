import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getApp, getApps, initializeServerApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const appName = 'lean-ehr-assisted-living-server'
export const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  appId: process.env.FB_APP_ID,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
}

let databaseId: string | undefined = undefined
if (process.env.VERCEL_ENV === 'preview') {
  databaseId = 'staging'
}

initializeServerApp(firebaseConfig, {})

// Can't use auth on both the backend and server...
// export const auth = getAuth(getApp(appName))
export const db = databaseId
  ? getFirestore(getApp(appName), databaseId)
  : getFirestore(getApp(appName))

// Connect to Firestore Emulator in development
if (process.env.NODE_ENV === 'development') {
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST
  const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT
  // const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!

  connectFirestoreEmulator(db, firestoreHost!, Number(firestorePort!))
  // connectAuthEmulator(auth, authHost)
  console.log('Server: Connected to Firestore and Auth emulators!')
}
