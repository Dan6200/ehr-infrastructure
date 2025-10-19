'use server'
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { Medication, EncryptedMedicationSchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateMedications(
  medications: Medication[],
  residentId: string,
  deletedMedicationIds: string[] = [],
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
    const medicationsRef = collection(
      db,
      'residents',
      residentId,
      'medications',
    )

    medications.forEach((med) => {
      const { id, ...medData } = med
      const docRef = id ? doc(medicationsRef, id) : doc(medicationsRef)

      const encryptedMedication: any = {}
      if (medData.name)
        encryptedMedication.encrypted_name = encryptData(
          medData.name,
          clinicalDek,
        )
      if (medData.rxnorm_code)
        encryptedMedication.encrypted_rxnorm_code = encryptData(
          medData.rxnorm_code,
          clinicalDek,
        )
      if (medData.dosage)
        encryptedMedication.encrypted_dosage = encryptData(
          medData.dosage,
          clinicalDek,
        )
      if (medData.frequency)
        encryptedMedication.encrypted_frequency = encryptData(
          medData.frequency,
          clinicalDek,
        )
      // Administrations are handled separately, not directly encrypted here

      batch.set(docRef, EncryptedMedicationSchema.parse(encryptedMedication), {
        merge: true,
      })
    })

    deletedMedicationIds.forEach((id) => {
      const docRef = doc(medicationsRef, id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Medications updated successfully.' }
  } catch (error) {
    console.error('Error updating medications: ', error)
    return { success: false, message: 'Failed to update medications.' }
  }
}
