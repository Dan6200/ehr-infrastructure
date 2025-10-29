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
import {
  EncryptedDiagnosticHistorySchema,
  DiagnosticHistorySchema,
} from '@/types'
import z from 'zod'

export async function decryptDiagnosticHistory(
  data: z.infer<typeof EncryptedDiagnosticHistorySchema>,
): Promise<z.infer<typeof DiagnosticHistorySchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    KEK_CLINICAL_PATH,
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

  return DiagnosticHistorySchema.parse(decryptedData)
}

export const getDiagnosticHistoryConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedDiagnosticHistorySchema>>
> => ({
  toFirestore(
    history: z.infer<typeof EncryptedDiagnosticHistorySchema>,
  ): DocumentData {
    return EncryptedDiagnosticHistorySchema.parse(history)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedDiagnosticHistorySchema> {
    return EncryptedDiagnosticHistorySchema.parse(snapshot.data())
  },
})
