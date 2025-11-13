'use server'

import { verifySession } from '@/auth/server/definitions'
import { collectionWrapper, getDocsWrapper } from '@/firebase/admin'
import {
  SubCollectionKey,
  subCollectionMap,
  SubCollectionMapType,
} from '@/types'
import { FirestoreDataConverter } from 'firebase-admin/firestore'
import { redirect } from 'next/navigation'
import z from 'zod'

async function getSubcollection<T, U>(
  providerId: string,
  residentId: string,
  collectionName: string,
  converter: () => Promise<FirestoreDataConverter<T>>,
  decryptor: (data: T) => Promise<U>,
): Promise<U[]> {
  const { uid } = await verifySession() // Authenticate and get user claims

  const path = `providers/${providerId}/residents/${residentId}/${collectionName}`
  console.log(`[getSubcollection] Fetching from path: ${path}`)

  const subcollectionRef = (await collectionWrapper(path)).withConverter(
    await converter(),
  )

  const snapshot = await getDocsWrapper(subcollectionRef)
  const encryptedDocs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.createTime,
    updated_at: doc.updateTime,
    viewed_at: doc.readTime,
  }))

  // TODO: Decrypt each document in parallel with threads
  return Promise.all(encryptedDocs.map((doc) => decryptor(doc)))
}

export async function getNestedResidentData<K extends SubCollectionKey>(
  providerId: string,
  residentId: string,
  subCollectionName: K,
) {
  const { converter, decryptor } = subCollectionMap[subCollectionName]
  return getSubcollection<
    z.infer<SubCollectionMapType[K]['encrypted_schema']>,
    z.infer<SubCollectionMapType[K]['schema']>
  >(providerId, residentId, subCollectionName, converter, decryptor)
}
