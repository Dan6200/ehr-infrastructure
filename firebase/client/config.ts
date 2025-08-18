import { getAuth } from "firebase/auth";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const appName = "linkID-client";
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
};

let databaseId: string | undefined = undefined;
if (process.env.VERCEL_ENV === "preview") {
  databaseId = "staging";
}

if (!getApps().find((app) => app?.name === appName))
  initializeApp(firebaseConfig, appName);

export const auth = getAuth(getApp(appName));
export const db = getFirestore(getApp(appName), databaseId);

// Connect to Firestore Emulator in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 1027);
  console.log('Client: Connected to Firestore emulator!');
}
