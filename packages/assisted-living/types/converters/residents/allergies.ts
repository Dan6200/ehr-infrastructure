'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedAllergySchema, AllergySchema } from '#root/types'
import z from 'zod'

export async function decryptAllergy(
  data: z.infer<typeof EncryptedAllergySchema>,
  kekPath: string,
): Promise<z.infer<typeof AllergySchema>> {
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

  if (decryptedData.name) {
    decryptedData.name = JSON.parse(decryptedData.name)
  }
  if (decryptedData.substance) {
    decryptedData.substance = JSON.parse(decryptedData.substance)
  }
  if (decryptedData.reaction) {
    decryptedData.reaction = JSON.parse(decryptedData.reaction)
  }

  return AllergySchema.parse(decryptedData)
}

export const getAllergiesConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedAllergySchema>>
> => ({
  toFirestore(allergy: z.infer<typeof EncryptedAllergySchema>): DocumentData {
    return EncryptedAllergySchema.parse(allergy)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedAllergySchema> {
    return EncryptedAllergySchema.parse(snapshot.data())
  },
})
