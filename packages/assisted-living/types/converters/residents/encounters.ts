'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedEncounterSchema } from '#root/types/encrypted-schemas'
import { EncounterSchema } from '#root/types/schemas/clinical/encounter'
import z from 'zod'

export async function decryptEncounter(
  data: z.infer<typeof EncryptedEncounterSchema>,
  kekPath: string,
): Promise<z.infer<typeof EncounterSchema>> {
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

  if (decryptedData.type) {
    decryptedData.type = JSON.parse(decryptedData.type)
  }
  if (decryptedData.business_status) {
    decryptedData.business_status = JSON.parse(decryptedData.business_status)
  }
  if (decryptedData.period) {
    decryptedData.period = JSON.parse(decryptedData.period)
  }
  if (decryptedData.diagnosis) {
    decryptedData.diagnosis = JSON.parse(decryptedData.diagnosis)
  }
  if (decryptedData.reason) {
    decryptedData.reason = JSON.parse(decryptedData.reason)
  }

  return EncounterSchema.parse(decryptedData)
}

export const getEncountersConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedEncounterSchema>>
> => ({
  toFirestore(
    encounter: z.infer<typeof EncryptedEncounterSchema>,
  ): DocumentData {
    return EncryptedEncounterSchema.parse(encounter)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedEncounterSchema> {
    return EncryptedEncounterSchema.parse(snapshot.data())
  },
})
