import { getAdminDb } from '#/firebase/admin'
import { Observation, EncryptedObservationSchema } from '#/types'
import { verifySession } from '#/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#/lib/encryption'

export async function updateObservations(
  observations: Observation[],
  residentId: string,
  deletedObservationIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  await verifySession()

  try {
    const adminDb = await getAdminDb()
    const residentRef = adminDb
      .collection('providers/GYRHOME/residents')
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

      const encryptedObservation: any = { encrypted_dek: encryptedDek }

      if (observationData.status)
        encryptedObservation.encrypted_status = encryptData(
          observationData.status,
          clinicalDek,
        )
      if (observationData.effective_datetime)
        encryptedObservation.encrypted_effective_datetime = encryptData(
          observationData.effective_datetime,
          clinicalDek,
        )
      if (observationData.loinc_code)
        encryptedObservation.encrypted_loinc_code = encryptData(
          observationData.loinc_code,
          clinicalDek,
        )
      if (observationData.name)
        encryptedObservation.encrypted_name = encryptData(
          observationData.name,
          clinicalDek,
        )
      if (observationData.value)
        encryptedObservation.encrypted_value = encryptData(
          observationData.value.toString(),
          clinicalDek,
        )
      if (observationData.unit)
        encryptedObservation.encrypted_unit = encryptData(
          observationData.unit,
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
