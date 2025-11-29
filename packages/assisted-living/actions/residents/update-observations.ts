'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Observation } from '#root/types/schemas/clinical/observation'
import { EncryptedObservationSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'

export async function updateObservations(
  observations: (Omit<Observation, 'resident_id' | 'recorder_id'> & {
    id?: string
  })[],
  residentId: string,
  deletedObservationIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  const { provider_id } = await verifySession()

  try {
    const adminDb = await getAdminDb()
    const residentRef = adminDb
      .collection(`providers/${provider_id}/residents`)
      .doc(residentId)
    const residentSnap = await residentRef.get()
    if (!residentSnap.exists) {
      throw new Error('Resident not found')
    }

    const encryptedDek = residentSnap.data()?.encrypted_dek_clinical
    if (!encryptedDek) {
      throw new Error('Clinical DEK not found for resident')
    }

    const clinicalDek = await decryptDataKey(
      Buffer.from(encryptedDek, 'base64'),
      KEK_CLINICAL_PATH,
    )

    const batch = adminDb.batch()
    const observationsRef = residentRef.collection('observations')

    observations.forEach((observation) => {
      const { id, ...observationData } = observation
      const docRef = id ? observationsRef.doc(id) : observationsRef.doc()

      const encryptedObservation: any = {}

      if (observationData.status)
        encryptedObservation.encrypted_status = encryptData(
          observationData.status,
          clinicalDek,
        )
      if (observationData.category)
        encryptedObservation.encrypted_category = encryptData(
          JSON.stringify(observationData.category),
          clinicalDek,
        )
      if (observationData.code)
        encryptedObservation.encrypted_code = encryptData(
          JSON.stringify(observationData.code),
          clinicalDek,
        )
      if (observationData.effective_datetime)
        encryptedObservation.encrypted_effective_datetime = encryptData(
          observationData.effective_datetime,
          clinicalDek,
        )
      if (observationData.value_quantity)
        encryptedObservation.encrypted_value_quantity = encryptData(
          JSON.stringify(observationData.value_quantity),
          clinicalDek,
        )
      if (observationData.body_site)
        encryptedObservation.encrypted_body_site = encryptData(
          JSON.stringify(observationData.body_site),
          clinicalDek,
        )
      if (observationData.method)
        encryptedObservation.encrypted_method = encryptData(
          JSON.stringify(observationData.method),
          clinicalDek,
        )
      if (observationData.device)
        encryptedObservation.encrypted_device = encryptData(
          JSON.stringify(observationData.device),
          clinicalDek,
        )

      batch.set(
        docRef,
        EncryptedObservationSchema.parse(encryptedObservation),
        { merge: true },
      )
    })

    deletedObservationIds.forEach((id) => {
      const docRef = observationsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Observations updated successfully.' }
  } catch (error) {
    console.error('Error updating observations: ', error)
    return { success: false, message: 'Failed to update observations.' }
  }
}
