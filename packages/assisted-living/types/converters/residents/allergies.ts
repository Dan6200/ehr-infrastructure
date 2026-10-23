'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedAllergySchema } from '#root/types/encrypted-schemas'
import { AllergySchema } from '#root/types/schemas/clinical/allergy'
import z from 'zod'
import { toPatientReference } from '#root/types/schemas/fhir/reference'
import { getCryptoProvider } from '#root/lib/crypto'
import {
  StoredAllergySchema,
  type StoredAllergy,
  isPlaintextAllergy,
  plaintextAllergyToDomain,
} from './allergy-codec'

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

  decryptedData.patient = toPatientReference(decryptedData.resident_id)
  return AllergySchema.parse(decryptedData)
}

/**
 * Scheme-aware read: dispatch on the document's own `crypto_scheme`, verify it
 * against the active mode, and fail closed on a mismatch.
 */
export async function decodeAllergy(
  data: StoredAllergy & { id: string },
  kekPath: string,
): Promise<z.infer<typeof AllergySchema>> {
  const provider = getCryptoProvider()

  if (isPlaintextAllergy(data)) {
    if (provider.scheme !== 'none:v1') {
      throw new Error(
        'Crypto scheme mismatch: plaintext document read in an envelope-mode tenant.',
      )
    }
    return plaintextAllergyToDomain(data)
  }

  if (provider.scheme !== 'kms-envelope:v1') {
    throw new Error(
      'Crypto scheme mismatch: envelope document read in a plaintext-mode tenant.',
    )
  }
  return decryptAllergy(data, kekPath)
}

export const getAllergiesConverter = async (): Promise<
  FirestoreDataConverter<StoredAllergy>
> => ({
  toFirestore(allergy: StoredAllergy): DocumentData {
    return StoredAllergySchema.parse(allergy)
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): StoredAllergy {
    return StoredAllergySchema.parse(snapshot.data())
  },
})
