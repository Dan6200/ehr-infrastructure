'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedObservationSchema } from '#root/types/encrypted-schemas'
import { ObservationSchema } from '#root/types/schemas/clinical/observation'
import z from 'zod'
import { observationCodec } from './codecs'
import { toPatientReference } from '#root/types/schemas/fhir/reference'

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

  if (decryptedData.category) {
    decryptedData.category = JSON.parse(decryptedData.category)
  }
  if (decryptedData.code) {
    decryptedData.code = JSON.parse(decryptedData.code)
  }
  if (decryptedData.value_quantity) {
    decryptedData.value_quantity = JSON.parse(decryptedData.value_quantity)
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

  decryptedData.subject = toPatientReference(decryptedData.resident_id)
  return ObservationSchema.parse(decryptedData)
}

export const getObservationsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof observationCodec.storedSchema>>
> => ({
  toFirestore(
    observation: z.infer<typeof observationCodec.storedSchema>,
  ): DocumentData {
    return observationCodec.storedSchema.parse(observation)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof observationCodec.storedSchema> {
    return observationCodec.storedSchema.parse(snapshot.data())
  },
})
