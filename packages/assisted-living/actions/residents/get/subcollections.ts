'use server'

import { verifySession } from '#root/auth/server/definitions'
import { collectionWrapper, getDocsWrapper } from '#root/firebase/admin'
import {
  SubCollectionKey,
  subCollectionMap,
  SubCollectionMapType,
} from '#root/types/subcollection-map'
import { FirestoreDataConverter } from 'firebase-admin/firestore'
import { z } from 'zod'

import {
  KEK_GENERAL_PATH,
  KEK_FINANCIAL_PATH,
  KEK_CLINICAL_PATH,
  KEK_CONTACT_PATH,
} from '#root/lib/encryption'
import { canAccessKekType, KekType } from '#root/lib/access-control'
import { getCryptoProvider } from '#root/lib/crypto'

function kekTypeToPath(kekType: KekType): string {
  switch (kekType) {
    case 'general':
      return KEK_GENERAL_PATH
    case 'financial':
      return KEK_FINANCIAL_PATH
    case 'clinical':
      return KEK_CLINICAL_PATH
    case 'contact':
      return KEK_CONTACT_PATH
  }
}

async function getSubcollection<T, U>(
  providerId: string,
  residentId: string,
  collectionName: string,
  converter: () => Promise<FirestoreDataConverter<T>>,
  decryptor: (data: T, kekPath: string) => Promise<U>,
  kekPath: string,
  plaintextToDomain?: (doc: any) => U,
): Promise<U[]> {
  const path = `providers/${providerId}/residents/${residentId}/${collectionName}`

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
  return Promise.all(
    encryptedDocs.map((doc) => {
      if (plaintextToDomain) {
        const provider = getCryptoProvider()
        if ((doc as any).crypto_scheme === 'none:v1') {
          if (provider.scheme !== 'none:v1') {
            throw new Error(
              'Crypto scheme mismatch: plaintext document read in an envelope-mode tenant.',
            )
          }
          return plaintextToDomain(doc)
        }
        if (provider.scheme !== 'kms-envelope:v1') {
          throw new Error(
            'Crypto scheme mismatch: envelope document read in a plaintext-mode tenant.',
          )
        }
      }
      return decryptor(doc, kekPath)
    }),
  )
}

export async function getNestedResidentData<K extends SubCollectionKey>(
  providerId: string,
  residentId: string,
  subCollectionName: K,
) {
  const { provider_id, roles = [] } = await verifySession()

  if (provider_id !== providerId) {
    throw new Error('Provider mismatch. Access denied.')
  }

  const { converter, decryptor, kekType } = subCollectionMap[subCollectionName]
  const plaintextToDomain = (subCollectionMap[subCollectionName] as any)
    .plaintext_to_domain as
    | ((doc: any) => z.infer<SubCollectionMapType[K]['schema']>)
    | undefined
  const dataClass = kekType as KekType

  if (!canAccessKekType(roles, dataClass)) {
    throw new Error(`Insufficient permissions to access ${subCollectionName}.`)
  }

  const kekPath = kekTypeToPath(dataClass)

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
    plaintextToDomain,
  )
}
