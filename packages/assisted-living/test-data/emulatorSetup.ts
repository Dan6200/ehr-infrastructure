import { getAdminDb } from '#root/firebase/admin'
import type { Firestore } from 'firebase-admin/firestore'

export const TEST_PROVIDER_ID = 'GYRHOME'

async function db(): Promise<Firestore> {
  return getAdminDb()
}

export async function clearFirestore(): Promise<void> {
  const adminDb = await db()
  await adminDb.recursiveDelete(adminDb.collection('providers'))
}

export async function seedFacility(
  id = 'FAC-1',
  address = '123 Care Street',
): Promise<void> {
  const adminDb = await db()
  await adminDb.doc(`providers/${TEST_PROVIDER_ID}/facilities/${id}`).set({
    address,
  })
}

export async function listResidentIds(): Promise<string[]> {
  const adminDb = await db()
  const snap = await adminDb
    .collection(`providers/${TEST_PROVIDER_ID}/residents`)
    .get()
  return snap.docs.map((doc) => doc.id)
}

export async function getStoredResident(
  id: string,
): Promise<Record<string, any> | undefined> {
  const adminDb = await db()
  const snap = await adminDb
    .doc(`providers/${TEST_PROVIDER_ID}/residents/${id}`)
    .get()
  return snap.data()
}

export async function getStoredSubcollection(
  residentId: string,
  collection: string,
): Promise<Record<string, any>[]> {
  const adminDb = await db()
  const snap = await adminDb
    .collection(
      `providers/${TEST_PROVIDER_ID}/residents/${residentId}/${collection}`,
    )
    .get()
  return snap.docs.map((doc) => doc.data())
}
