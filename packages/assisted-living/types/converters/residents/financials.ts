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
import {
  EncryptedFinancialTransactionSchema,
  FinancialTransactionSchema,
} from '@/types'
import z from 'zod'

export async function decryptFinancialTransaction(
  data: z.infer<typeof EncryptedFinancialTransactionSchema>,
): Promise<z.infer<typeof FinancialTransactionSchema>> {
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
  decryptedData.amount = parseFloat(decryptedData.amount)
  return FinancialTransactionSchema.parse(decryptedData)
}

export const getFinancialsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedFinancialTransactionSchema>>
> => ({
  toFirestore(
    transaction: z.infer<typeof EncryptedFinancialTransactionSchema>,
  ): DocumentData {
    return EncryptedFinancialTransactionSchema.parse(transaction)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedFinancialTransactionSchema> {
    return EncryptedFinancialTransactionSchema.parse(snapshot.data())
  },
})
