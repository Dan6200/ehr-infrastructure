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
import { EncryptedTaskSchema, TaskSchema } from '@/types'
import z from 'zod'

export async function decryptTask(
  data: z.infer<typeof EncryptedTaskSchema>,
): Promise<z.infer<typeof TaskSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    KEK_CLINICAL_PATH,
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

  if (decryptedData.requested_period) {
    decryptedData.requested_period = JSON.parse(decryptedData.requested_period)
  }
  if (decryptedData.execution_period) {
    decryptedData.execution_period = JSON.parse(decryptedData.execution_period)
  }

  return TaskSchema.parse(decryptedData)
}

export const getTasksConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedTaskSchema>>
> => ({
  toFirestore(task: z.infer<typeof EncryptedTaskSchema>): DocumentData {
    return EncryptedTaskSchema.parse(task)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedTaskSchema> {
    return EncryptedTaskSchema.parse(snapshot.data())
  },
})
