'use server'
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { Observation, EncryptedObservationSchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateObservations(
  observations: Observation[],
  residentId: string,
  deletedObservationIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  const { currentUser } = await getAuthenticatedAppForUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  try {
    const residentRef = doc(db, 'residents', residentId)
    const residentSnap = await getDoc(residentRef)
    if (!residentSnap.exists()) {
      throw new Error('Resident not found')
    }

    const encryptedDek = residentSnap.data().encrypted_dek_clinical
    if (!encryptedDek) {
      throw new Error('Clinical DEK not found for resident')
    }

    const clinicalDek = await decryptDataKey(
      Buffer.from(encryptedDek, 'base64'),
      KEK_CLINICAL_PATH,
    )

    const batch = writeBatch(db)
    const observationsRef = collection(
      db,
      'residents',
      residentId,
      'observations',
    )

    observations.forEach((observation) => {
      const { id, ...observationData } = observation
      const docRef = id ? doc(observationsRef, id) : doc(observationsRef)

      const encryptedObservation: any = {}
      if (observationData.date)
        encryptedObservation.encrypted_date = encryptData(
          observationData.date,
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
          observationData.value,
          clinicalDek,
        )
      if (observationData.unit)
        encryptedObservation.encrypted_unit = encryptData(
          observationData.unit,
          clinicalDek,
        )

      batch.set(
        docRef,
        EncryptedObservationSchema.parse(encryptedObservation),
        { merge: true },
      )
    })

    deletedObservationIds.forEach((id) => {
      const docRef = doc(observationsRef, id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Observations updated successfully.' }
  } catch (error) {
    console.error('Error updating observations: ', error)
    return { success: false, message: 'Failed to update observations.' }
  }
}
