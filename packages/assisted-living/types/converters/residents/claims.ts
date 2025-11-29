'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedClaimSchema } from '#root/types/encrypted-schemas'
import { ClaimSchema } from '#root/types/schemas/financial/claim'
import z from 'zod'

export async function decryptClaim(
  data: z.infer<typeof EncryptedClaimSchema>,
  kekPath: string,
): Promise<z.infer<typeof ClaimSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id') || key === 'charge_ids') {
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

  if (decryptedData.total) {
    const parsed = JSON.parse(decryptedData.total)
    if (typeof parsed.value === 'number') {
      parsed.value = parseFloat(parsed.value.toFixed(2))
    }
    decryptedData.total = parsed
  }

  return ClaimSchema.parse(decryptedData)
}

export const getClaimsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedClaimSchema>>
> => ({
  toFirestore(claim: z.infer<typeof EncryptedClaimSchema>): DocumentData {
    return EncryptedClaimSchema.parse(claim)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedClaimSchema> {
    return EncryptedClaimSchema.parse(snapshot.data())
  },
})
