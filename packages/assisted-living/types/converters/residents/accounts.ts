'use server'
import { decryptDataKey, decryptData } from '#/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedAccountSchema, AccountSchema } from '#/types'
import z from 'zod'

export async function decryptAccount(
  data: z.infer<typeof EncryptedAccountSchema>,
  kekPath: string,
): Promise<z.infer<typeof AccountSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id')) {
      decryptedData[key] = (data as any)[key]
    } else if (key === 'subject') {
      // Handle partially encrypted subject object
      decryptedData.subject = {
        id: data.subject.id,
        name: decryptData(data.subject.encrypted_name, dek),
      }
    } else if (
      key.startsWith('encrypted_') &&
      key !== 'encrypted_dek' &&
      !!(data as any)[key]
    ) {
      const newKey = key.replace('encrypted_', '')
      decryptedData[newKey] = decryptData((data as any)[key], dek)
    }
  }

  if (decryptedData.balance) {
    decryptedData.balance = JSON.parse(decryptedData.balance)
  }
  if (decryptedData.billing_status) {
    decryptedData.billing_status = JSON.parse(decryptedData.billing_status)
  }
  if (decryptedData.guarantor) {
    decryptedData.guarantor = JSON.parse(decryptedData.guarantor)
  }
  if (decryptedData.service_period) {
    decryptedData.service_period = JSON.parse(decryptedData.service_period)
  }

  return AccountSchema.parse(decryptedData)
}

export const getAccountsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedAccountSchema>>
> => ({
  toFirestore(account: z.infer<typeof EncryptedAccountSchema>): DocumentData {
    return EncryptedAccountSchema.parse(account)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedAccountSchema> {
    return EncryptedAccountSchema.parse(snapshot.data())
  },
})
