'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedCarePlanActivitySchema } from '#root/types/encrypted-schemas'
import { CarePlanActivitySchema } from '#root/types/schemas/clinical/care-plan-activity'
import z from 'zod'

export async function decryptCarePlanActivity(
  data: z.infer<typeof EncryptedCarePlanActivitySchema> & {
    document_id: string
  },
  kekPath: string,
): Promise<z.infer<typeof CarePlanActivitySchema> & { document_id: string }> {
  const { document_id } = data
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )

  const decryptedData: any = { id: document_id, careplan_id: data.careplan_id }

  if (data.encrypted_code)
    decryptedData.code = JSON.parse(decryptData(data.encrypted_code, dek))
  if (data.encrypted_status)
    decryptedData.status = decryptData(data.encrypted_status, dek)
  if (data.encrypted_timing)
    decryptedData.timing = JSON.parse(decryptData(data.encrypted_timing, dek))
  if (data.encrypted_staff_instructions)
    decryptedData.staff_instructions = decryptData(
      data.encrypted_staff_instructions,
      dek,
    )

  if (data.performer) {
    decryptedData.performer = { id: data.performer.id }
    if (data.performer.encrypted_name) {
      decryptedData.performer.name = decryptData(
        data.performer.encrypted_name,
        dek,
      )
    }
    if (data.performer.encrypted_period) {
      decryptedData.performer.period = JSON.parse(
        decryptData(data.performer.encrypted_period, dek),
      )
    }
  }

  return { document_id, ...CarePlanActivitySchema.parse(decryptedData) }
}

export const getCarePlanActivitiesConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedCarePlanActivitySchema>>
> => ({
  toFirestore(
    activity: z.infer<typeof EncryptedCarePlanActivitySchema>,
  ): DocumentData {
    return EncryptedCarePlanActivitySchema.parse(activity)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedCarePlanActivitySchema> {
    return EncryptedCarePlanActivitySchema.parse(snapshot.data())
  },
})
