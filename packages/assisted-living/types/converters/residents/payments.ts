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
import { EncryptedPaymentSchema, PaymentSchema } from '@/types'
import z from 'zod'

export async function decryptPayment(
  data: z.infer<typeof EncryptedPaymentSchema>,
): Promise<z.infer<typeof PaymentSchema>> {
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

  if (decryptedData.amount) {
    decryptedData.amount = JSON.parse(decryptedData.amount)
  }

  return PaymentSchema.parse(decryptedData)
}

export const getPaymentsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedPaymentSchema>>
> => ({
  toFirestore(payment: z.infer<typeof EncryptedPaymentSchema>): DocumentData {
    return EncryptedPaymentSchema.parse(payment)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedPaymentSchema> {
    return EncryptedPaymentSchema.parse(snapshot.data())
  },
})
