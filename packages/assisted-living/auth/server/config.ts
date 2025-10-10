import { getAuth } from 'firebase/auth'
import { initializeServerApp } from 'firebase/app'
import { headers } from 'next/headers'

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

const authIdToken = (await headers()).get('Authorization')?.split('Bearer ')[1]

export const app = initializeServerApp(firebaseConfig, {
  authIdToken,
  releaseOnDeref: headers(),
})

export const auth = getAuth(app)

// Connect to Firestore Emulator in development
if (process.env.NODE_ENV === 'development') {
  // Emulator connection for FirebaseServerApp is not directly supported here
  // as it's a client-side concept running on server. Firestore emulator connection
  // should be handled by the actual Firestore SDK instance that FirebaseServerApp uses.
  // This block will be removed or adjusted when we create firestore-server.ts
  console.log(
    'Server: FirebaseServerApp initialized. Firestore emulator connection will be handled by firestore-server.ts',
  )
}
