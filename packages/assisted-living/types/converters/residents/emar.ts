'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedEmarRecordSchema, EmarRecordSchema } from '#root/types'
import z from 'zod'

export async function decryptEmarRecord(
  data: z.infer<typeof EncryptedEmarRecordSchema>,
  kekPath: string,
): Promise<z.infer<typeof EmarRecordSchema>> {
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

  if (decryptedData.medication) {
    decryptedData.medication = JSON.parse(decryptedData.medication)
  }
  if (decryptedData.dosage) {
    decryptedData.dosage = JSON.parse(decryptedData.dosage)
  }

  return EmarRecordSchema.parse(decryptedData)
}

export const getEmarRecordConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedEmarRecordSchema>>
> => ({
  toFirestore(record: z.infer<typeof EncryptedEmarRecordSchema>): DocumentData {
    return EncryptedEmarRecordSchema.parse(record)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedEmarRecordSchema> {
    return EncryptedEmarRecordSchema.parse(snapshot.data())
  },
})
