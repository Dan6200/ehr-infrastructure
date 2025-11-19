'use server'
import { decryptDataKey, decryptData } from '#/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedAddressSchema, AddressSchema } from '#/types'
import z from 'zod'

export async function decryptAddress(
  data: z.infer<typeof EncryptedAddressSchema>,
  kekPath: string,
): Promise<z.infer<typeof AddressSchema>> {
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

  if (decryptedData.line) {
    decryptedData.line = JSON.parse(decryptedData.line)
  }
  if (decryptedData.period) {
    decryptedData.period = JSON.parse(decryptedData.period)
  }

  return AddressSchema.parse(decryptedData)
}

export const getAddressesConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedAddressSchema>>
> => ({
  toFirestore(address: z.infer<typeof EncryptedAddressSchema>): DocumentData {
    return EncryptedAddressSchema.parse(address)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedAddressSchema> {
    return EncryptedAddressSchema.parse(snapshot.data())
  },
})
