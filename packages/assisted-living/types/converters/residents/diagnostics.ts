'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedDiagnosticHistorySchema } from '#root/types/encrypted-schemas'
import { DiagnosticHistorySchema } from '#root/types/schemas/clinical/diagnostic-history'
import z from 'zod'

export async function decryptDiagnosticHistory(
  data: z.infer<typeof EncryptedDiagnosticHistorySchema>,
  kekPath: string,
): Promise<z.infer<typeof DiagnosticHistorySchema>> {
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
  if (decryptedData.code) {
    decryptedData.code = JSON.parse(decryptedData.code)
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
