'use server'
import { KEK_GENERAL_PATH, decryptDataKey, decryptData } from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedIdentifierSchema, IdentifierSchema } from '@/types'
import z from 'zod'

export async function decryptIdentifier(
  data: z.infer<typeof EncryptedIdentifierSchema>,
  kekPath: string,
): Promise<z.infer<typeof IdentifierSchema>> {
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

  return IdentifierSchema.parse(decryptedData)
}

export const getIdentifiersConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedIdentifierSchema>>
> => ({
  toFirestore(
    identifier: z.infer<typeof EncryptedIdentifierSchema>,
  ): DocumentData {
    return EncryptedIdentifierSchema.parse(identifier)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedIdentifierSchema> {
    return EncryptedIdentifierSchema.parse(snapshot.data())
  },
})
