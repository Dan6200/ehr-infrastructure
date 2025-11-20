'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedChargeSchema, ChargeSchema } from '#root/types'
import z from 'zod'

export async function decryptCharge(
  data: z.infer<typeof EncryptedChargeSchema>,
  kekPath: string,
): Promise<z.infer<typeof ChargeSchema>> {
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

  console.log('****Debugging: Decrypted Data *****')
  console.log(decryptedData)
  if (decryptedData.unit_price) {
    decryptedData.unit_price = JSON.parse(decryptedData.unit_price)
  }
  if (decryptedData.quantity) {
    decryptedData.quantity = parseInt(decryptedData.quantity, 10)
  }

  return ChargeSchema.parse(decryptedData)
}

export const getChargesConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedChargeSchema>>
> => ({
  toFirestore(charge: z.infer<typeof EncryptedChargeSchema>): DocumentData {
    return EncryptedChargeSchema.parse(charge)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedChargeSchema> {
    return EncryptedChargeSchema.parse(snapshot.data())
  },
})
