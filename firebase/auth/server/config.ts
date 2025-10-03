import { getApp, initializeApp } from 'firebase-admin/app'
import fbAdmin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { Firestore, initializeFirestore } from 'firebase-admin/firestore'

const { credential } = fbAdmin
const appName = 'linkID-server'

let databaseId: string | undefined = undefined
if (process.env.VERCEL_ENV === 'preview') {
  databaseId = 'staging'
}

if (!fbAdmin.apps.find((app) => app?.name === appName)) {
  if (process.env.NODE_ENV === 'production') {
    // Use service account key in production
    initializeApp(
      {
        credential: credential.cert({
          projectId: process.env.FB_PROJECT_ID,
          clientEmail: process.env.FB_CLIENT_EMAIL,
          privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      },
      appName,
    )
  } else {
    initializeApp(
      {
        projectId: process.env.FB_PROJECT_ID,
      },
      appName,
    )
  }
}

export const auth = getAuth(getApp(appName))
let db: Firestore
db = databaseId
  ? initializeFirestore(getApp(appName), {}, databaseId)
  : initializeFirestore(getApp(appName), {})

if (process.env.NODE_ENV === 'development') {
  // const firestoreHost =
  //   process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST?.split(':')[0]
  // const firestorePort =
  //   process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST?.split(':')[1]
  // const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!
  //
  // connectFirestoreEmulator(db, firestoreHost!, Number(firestorePort!))
  // connectAuthEmulator(auth, authHost)
  console.log(
    `Server:\nConnected to Firebase Auth emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST};\nConnected to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`,
  )
}
export default db
