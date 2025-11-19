'use server'
import { decryptDataKey, decryptData } from '#/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedObservationSchema, ObservationSchema } from '#/types'
import z from 'zod'

export async function decryptObservation(
  data: z.infer<typeof EncryptedObservationSchema>,
  kekPath: string,
): Promise<z.infer<typeof ObservationSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id')) {
      decryptedData[key] = (data as any)[key]
    } else if (
      key.startsWith('encrypted_') &&
      key !== 'encrypted_dek' &&
      !!(data as any)[key]
    ) {
      const newKey = key.replace('encrypted_', '')
      decryptedData[newKey] = decryptData((data as any)[key], dek)
    }
  }

  if (decryptedData.body_site) {
    decryptedData.body_site = JSON.parse(decryptedData.body_site)
  }
  if (decryptedData.method) {
    decryptedData.method = JSON.parse(decryptedData.method)
  }
  if (decryptedData.device) {
    decryptedData.device = JSON.parse(decryptedData.device)
  }
  if (decryptedData.value) {
    decryptedData.value = parseFloat(decryptedData.value)
  }

  return ObservationSchema.parse(decryptedData)
}

export const getObservationsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedObservationSchema>>
> => ({
  toFirestore(
    observation: z.infer<typeof EncryptedObservationSchema>,
  ): DocumentData {
    return EncryptedObservationSchema.parse(observation)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedObservationSchema> {
    return EncryptedObservationSchema.parse(snapshot.data())
  },
})
