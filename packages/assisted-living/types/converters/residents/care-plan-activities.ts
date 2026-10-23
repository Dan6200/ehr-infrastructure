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
  data: z.infer<typeof EncryptedCarePlanActivitySchema> & { id: string },
  kekPath: string,
): Promise<z.infer<typeof CarePlanActivitySchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )

  const decryptedData: any = {
    id: data.id,
    resident_id: data.resident_id,
    careplan_id: data.careplan_id,
  }

  if (data.encrypted_kind)
    decryptedData.kind = decryptData(data.encrypted_kind, dek)
  if (data.encrypted_code)
    decryptedData.code = JSON.parse(decryptData(data.encrypted_code, dek))
  if (data.encrypted_status)
    decryptedData.status = decryptData(data.encrypted_status, dek)
  if (data.encrypted_status_reason)
    decryptedData.status_reason = JSON.parse(
      decryptData(data.encrypted_status_reason, dek),
    )
  if (data.encrypted_do_not_perform)
    decryptedData.do_not_perform =
      decryptData(data.encrypted_do_not_perform, dek) === 'true'
  if (data.encrypted_scheduled)
    decryptedData.scheduled = JSON.parse(
      decryptData(data.encrypted_scheduled, dek),
    )
  if (data.encrypted_performer)
    decryptedData.performer = JSON.parse(
      decryptData(data.encrypted_performer, dek),
    )
  if (data.encrypted_description)
    decryptedData.description = decryptData(data.encrypted_description, dek)

  return CarePlanActivitySchema.parse(decryptedData)
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
