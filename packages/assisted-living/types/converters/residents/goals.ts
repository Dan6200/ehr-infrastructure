'use server'
import {
  KEK_CLINICAL_PATH,
  decryptDataKey,
  decryptData,
} from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedGoalSchema, GoalSchema } from '@/types'
import z from 'zod'

export async function decryptGoal(
  data: z.infer<typeof EncryptedGoalSchema>,
  kekPath: string,
): Promise<z.infer<typeof GoalSchema>> {
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

  if (decryptedData.description) {
    decryptedData.description = JSON.parse(decryptedData.description)
  }

  return GoalSchema.parse(decryptedData)
}

export const getGoalsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedGoalSchema>>
> => ({
  toFirestore(goal: z.infer<typeof EncryptedGoalSchema>): DocumentData {
    return EncryptedGoalSchema.parse(goal)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedGoalSchema> {
    return EncryptedGoalSchema.parse(snapshot.data())
  },
})
