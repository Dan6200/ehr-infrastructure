'use server'

import { verifySession } from '@/auth/server/definitions'
import { collectionWrapper, getDocsWrapper } from '@/firebase/admin'
import {
  SubCollectionKey,
  subCollectionMap,
  SubCollectionMapType,
} from '@/types'
import { FirestoreDataConverter } from 'firebase-admin/firestore'
import z from 'zod'

async function getSubcollection<T, U>(
  residentId: string,
  collectionName: string,
  converter: () => Promise<FirestoreDataConverter<T>>,
  decryptor: (data: T) => Promise<U>,
): Promise<U[]> {
  await verifySession() // Authenticate the request first

  const subcollectionRef = (
    await collectionWrapper(
      `providers/GYRHOME/residents/${residentId}/${collectionName}`,
    )
  ).withConverter(await converter())

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
  residentId: string,
  subCollectionName: K,
) {
  const { converter, decryptor } = subCollectionMap[subCollectionName]
  return getSubcollection<
    z.infer<SubCollectionMapType[K]['encrypted_schema']>,
    z.infer<SubCollectionMapType[K]['schema']>
  >(residentId, subCollectionName, converter, decryptor)
}
