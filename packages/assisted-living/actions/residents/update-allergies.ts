import { getAdminDb } from '#/firebase/admin'
import { Allergy, EncryptedAllergySchema } from '#/types'
import { verifySession } from '#/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#/lib/encryption'

export async function updateAllergies(
  allergies: (Allergy & { id: string })[],
  residentId: string,
  deletedAllergyIds: string[] = [],
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
    const allergiesRef = adminDb
      .collection('providers/GYRHOME/residents')
      .doc(residentId)
      .collection('allergies')

    // Handle creations and updates
    allergies.forEach((allergy) => {
      const { id, ...allergyData } = allergy
      const docRef = id ? allergiesRef.doc(id) : allergiesRef.doc()

      const encryptedAllergy: any = {}
      if (allergyData.name)
        encryptedAllergy.encrypted_name = encryptData(
          allergyData.name,
          clinicalDek,
        )
      if (allergyData.snomed_code)
        encryptedAllergy.encrypted_snomed_code = encryptData(
          allergyData.snomed_code,
          clinicalDek,
        )
      if (allergyData.reaction)
        encryptedAllergy.encrypted_reaction = encryptData(
          allergyData.reaction,
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
