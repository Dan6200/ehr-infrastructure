'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedCoverageSchema, CoverageSchema } from '#root/types'
import z from 'zod'

export async function decryptCoverage(
  data: z.infer<typeof EncryptedCoverageSchema>,
  kekPath: string,
): Promise<z.infer<typeof CoverageSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id')) {
      decryptedData[key] = (data as any)[key]
    } else if (key === 'payor') {
      decryptedData.payor = {
        id: data.payor.id,
        organization: !!data.payor.encrypted_organization
          ? decryptData(data.payor.encrypted_organization, dek)
          : null,
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

  if (decryptedData.period) {
    decryptedData.period = JSON.parse(decryptedData.period)
  }
  if (decryptedData.class) {
    decryptedData.class = JSON.parse(decryptedData.class)
  }
  if (decryptedData.cost_to_beneficiary) {
    decryptedData.cost_to_beneficiary = parseFloat(
      decryptedData.cost_to_beneficiary,
    )
  }

  return CoverageSchema.parse(decryptedData)
}

export const getCoveragesConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedCoverageSchema>>
> => ({
  toFirestore(coverage: z.infer<typeof EncryptedCoverageSchema>): DocumentData {
    return EncryptedCoverageSchema.parse(coverage)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedCoverageSchema> {
    return EncryptedCoverageSchema.parse(snapshot.data())
  },
})
