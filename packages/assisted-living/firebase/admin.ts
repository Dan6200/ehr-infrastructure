'use server'
import admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Firestore,
  Query,
} from 'firebase-admin/firestore'
import { Auth } from 'firebase-admin/auth'
import { adminConfig } from './config'

let db: Firestore | null = null
let auth: Auth | null = null

// A private function to ensure the admin app is initialized on-demand.
async function initializeAdminApp() {
  if (!getApps().length) {
    admin.initializeApp({
      ...adminConfig,
      credential: admin.credential.applicationDefault(), // ADC handles local vs. cloud
    })
  }
}

// Getter for the Firestore admin instance that ensures it's configured only once.
export async function getAdminDb(): Promise<Firestore> {
  if (db) {
    return db
  }
  await initializeAdminApp()
  // Apply settings *before* the first use
  const firestore = admin.firestore()
  if (!firestore._settingsFrozen) firestore.settings({ databaseId: 'staging' })
  db = firestore
  return db
}

// Getter for the Auth admin instance
export async function getAdminAuth(): Promise<Auth> {
  if (auth) {
    return auth
  }
  await initializeAdminApp()
  auth = admin.auth()
  return auth
}

// --- Refactored Wrappers to use Admin SDK ---

export async function collectionWrapper<T = DocumentData>(path: string) {
  const adminDb = await getAdminDb()
  try {
    return adminDb.collection(path) as CollectionReference<T>
  } catch (e) {
    throw new Error(
      `Could not retrieve the ${path} Collection -- Tag:15.\n\t` + e,
    )
  }
}

export async function addDocWrapper<T>(
  reference: CollectionReference<T>,
  data: T,
) {
  return reference.add(data).catch((err) => {
    throw new Error('Error adding document -- Tag:4.\n\t' + err)
  })
}

export async function getDocWrapper<T>(ref: DocumentReference<T>) {
  return ref.get().catch((err) => {
    throw new Error('Error retrieving document -- Tag:7.\n\t' + err)
  })
}

export async function getDocsWrapper<T>(
  query: Query<T> | CollectionReference<T>,
) {
  return query.get().catch((err: any) => {
    throw new Error('Error retrieving all documents -- Tag:11.\n\t' + err)
  })
}

// Corrected docWrapper to maintain generic type from the collection
export async function docWrapper<T>(
  collectionRef: CollectionReference<T>,
  docId: string,
) {
  try {
    return collectionRef.doc(docId)
  } catch (e) {
    throw new Error(`Error retrieving the ${docId} Document -- Tag:13.\n\t` + e)
  }
}

export async function updateDocWrapper<T extends DocumentData>(
  reference: DocumentReference<T>,
  data: Partial<T>,
) {
  return reference.update(data).catch((err) => {
    throw new Error('Error updating document -- Tag:5.\n\t' + err)
  })
}

export async function deleteDocWrapper<T>(reference: DocumentReference<T>) {
  return reference.delete().catch((err) => {
    throw new Error('Error deleting document -- Tag:6.\n\t' + err)
  })
}

// Re-added getCount wrapper using Admin SDK syntax
export async function getCountWrapper<T>(query: Query<T>) {
  try {
    const snapshot = await query.count().get()
    return snapshot.data().count
  } catch (err) {
    throw new Error('Error retrieving count from query: ' + err)
  }
}
