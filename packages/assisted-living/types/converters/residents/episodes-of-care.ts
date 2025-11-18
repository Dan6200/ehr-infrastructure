'use server'
import {
  KEK_CLINICAL_PATH,
  decryptDataKey,
  decryptData,
} from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedEpisodesOfCareSchema, EpisodesOfCareSchema } from '@/types'
import z from 'zod'

export async function decryptEpisodesOfCare(
  data: z.infer<typeof EncryptedEpisodesOfCareSchema>,
  kekPath: string,
): Promise<z.infer<typeof EpisodesOfCareSchema>> {
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
  if (decryptedData.period) {
    decryptedData.period = JSON.parse(decryptedData.period)
  }
  if (decryptedData.diagnosis) {
    decryptedData.diagnosis = JSON.parse(decryptedData.diagnosis)
  }
  if (decryptedData.reason) {
    decryptedData.reason = JSON.parse(decryptedData.reason)
  }
  if (decryptedData.team_ids) {
    decryptedData.team_ids = JSON.parse(decryptedData.team_ids)
  }

  return EpisodesOfCareSchema.parse(decryptedData)
}

export const getEpisodesOfCareConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedEpisodesOfCareSchema>>
> => ({
  toFirestore(
    episode: z.infer<typeof EncryptedEpisodesOfCareSchema>,
  ): DocumentData {
    return EncryptedEpisodesOfCareSchema.parse(episode)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedEpisodesOfCareSchema> {
    return EncryptedEpisodesOfCareSchema.parse(snapshot.data())
  },
})
