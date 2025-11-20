'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedPaymentSchema, PaymentSchema } from '#root/types'
import z from 'zod'

export async function decryptPayment(
  data: z.infer<typeof EncryptedPaymentSchema>,
  kekPath: string,
): Promise<z.infer<typeof PaymentSchema>> {
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

  if (decryptedData.amount) {
    const parsed = JSON.parse(decryptedData.amount)
    if (typeof parsed.value === 'number') {
      parsed.value = parseFloat(parsed.value.toFixed(2))
    }
    decryptedData.amount = parsed
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
