'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Allergy } from '#root/types/schemas/clinical/allergy'
import { EncryptedAllergySchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'

export async function updateAllergies(
  allergies: (Omit<Allergy, 'resident_id' | 'recorder_id'> & { id?: string })[],
  residentId: string,
  deletedAllergyIds: string[] = [],
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
    const allergiesRef = adminDb
      .collection(`providers/${provider_id}/residents`)
      .doc(residentId)
      .collection('allergies')

    // Handle creations and updates
    allergies.forEach((allergy) => {
      const { id, ...allergyData } = allergy
      const docRef = id ? allergiesRef.doc(id) : allergiesRef.doc()

      const encryptedAllergy: any = {}

      if (allergyData.clinical_status)
        encryptedAllergy.encrypted_clinical_status = encryptData(
          allergyData.clinical_status,
          clinicalDek,
        )
      if (allergyData.verification_status)
        encryptedAllergy.encrypted_verification_status = encryptData(
          allergyData.verification_status,
          clinicalDek,
        )
      if (allergyData.type)
        encryptedAllergy.encrypted_type = encryptData(
          allergyData.type,
          clinicalDek,
        )
      if (allergyData.name)
        encryptedAllergy.encrypted_name = encryptData(
          JSON.stringify(allergyData.name),
          clinicalDek,
        )
      if (allergyData.recorded_date)
        encryptedAllergy.encrypted_recorded_date = encryptData(
          allergyData.recorded_date,
          clinicalDek,
        )
      if (allergyData.substance)
        encryptedAllergy.encrypted_substance = encryptData(
          JSON.stringify(allergyData.substance),
          clinicalDek,
        )
      if (allergyData.reaction)
        encryptedAllergy.encrypted_reaction = encryptData(
          JSON.stringify(allergyData.reaction),
          clinicalDek,
        )

      batch.set(docRef, EncryptedAllergySchema.parse(encryptedAllergy), {
        merge: true,
      })
    })

    // Handle deletions
    deletedAllergyIds.forEach((id) => {
      const docRef = allergiesRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Allergies updated successfully.' }
  } catch (error) {
    console.error('Error updating allergies: ', error)
    return { success: false, message: 'Failed to update allergies.' }
  }
}
