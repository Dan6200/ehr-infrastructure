'use server'
import { decryptDataKey, decryptData } from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedCarePlanSchema, CarePlanSchema } from '@/types'
import z from 'zod'

export async function decryptCarePlan(
  data: z.infer<typeof EncryptedCarePlanSchema>,
  kekPath: string,
): Promise<z.infer<typeof CarePlanSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id') || key === 'goal_ids') {
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

  if (decryptedData.activities) {
    decryptedData.activities = JSON.parse(decryptedData.activities)
  }

  return CarePlanSchema.parse(decryptedData)
}

export const getCarePlansConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedCarePlanSchema>>
> => ({
  toFirestore(carePlan: z.infer<typeof EncryptedCarePlanSchema>): DocumentData {
    return EncryptedCarePlanSchema.parse(carePlan)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedCarePlanSchema> {
    return EncryptedCarePlanSchema.parse(snapshot.data())
  },
})
