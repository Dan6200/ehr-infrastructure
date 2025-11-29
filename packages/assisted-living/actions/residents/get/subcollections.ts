'use server'

import { verifySession } from '#root/auth/server/definitions'
import { collectionWrapper, getDocsWrapper } from '#root/firebase/admin'
import {
  SubCollectionKey,
  subCollectionMap,
  SubCollectionMapType,
} from '#root/types/subcollection-map'
import { FirestoreDataConverter } from 'firebase-admin/firestore'
import z from 'zod'

import {
  KEK_FINANCIAL_PATH,
  KEK_CLINICAL_PATH,
  KEK_CONTACT_PATH,
} from '#root/lib/encryption'

async function getSubcollection<T, U>(
  providerId: string,
  residentId: string,
  collectionName: string,
  converter: () => Promise<FirestoreDataConverter<T>>,
  decryptor: (data: T, kekPath: string) => Promise<U>,
  kekPath: string,
): Promise<U[]> {
  await verifySession() // Authenticate and get user claims

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
  return Promise.all(encryptedDocs.map((doc) => decryptor(doc, kekPath)))
}

export async function getNestedResidentData<K extends SubCollectionKey>(
  providerId: string,
  residentId: string,
  subCollectionName: K,
) {
  const { converter, decryptor, kekType } = subCollectionMap[subCollectionName]
  let kekPath = ''
  switch (kekType) {
    case 'financial':
      kekPath = KEK_FINANCIAL_PATH
      break
    case 'clinical':
      kekPath = KEK_CLINICAL_PATH
      break
    case 'contact':
      kekPath = KEK_CONTACT_PATH
      break
    default:
      throw new Error(`Invalid KEK type for ${subCollectionName}`)
  }

  return getSubcollection<
    z.infer<SubCollectionMapType[K]['encrypted_schema']>,
    z.infer<SubCollectionMapType[K]['schema']>
  >(
    providerId,
    residentId,
    subCollectionName,
    converter,
    decryptor as any,
    kekPath,
  )
}
