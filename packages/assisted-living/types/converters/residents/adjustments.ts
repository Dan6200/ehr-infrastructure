'use server'
import {
  KEK_FINANCIAL_PATH,
  decryptDataKey,
  decryptData,
} from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedAdjustmentSchema, AdjustmentSchema } from '@/types'
import z from 'zod'

export async function decryptAdjustment(
  data: z.infer<typeof EncryptedAdjustmentSchema>,
): Promise<z.infer<typeof AdjustmentSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    KEK_FINANCIAL_PATH,
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

  if (decryptedData.approved_amount) {
    decryptedData.approved_amount = JSON.parse(decryptedData.approved_amount)
  }

  return AdjustmentSchema.parse(decryptedData)
}

export const getAdjustmentsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedAdjustmentSchema>>
> => ({
  toFirestore(
    adjustment: z.infer<typeof EncryptedAdjustmentSchema>,
  ): DocumentData {
    return EncryptedAdjustmentSchema.parse(adjustment)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedAdjustmentSchema> {
    return EncryptedAdjustmentSchema.parse(snapshot.data())
  },
})
