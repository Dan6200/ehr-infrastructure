import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { Allergy, EncryptedAllergySchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateAllergies(
  allergies: Allergy[],
  residentId: string,
  deletedAllergyIds: string[] = [],
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
    const allergiesRef = collection(db, 'residents', residentId, 'allergies')

    // Handle creations and updates
    allergies.forEach((allergy) => {
      const { id, ...allergyData } = allergy
      const docRef = id ? doc(allergiesRef, id) : doc(allergiesRef)

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
      const docRef = doc(allergiesRef, id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Allergies updated successfully.' }
  } catch (error) {
    console.error('Error updating allergies: ', error)
    return { success: false, message: 'Failed to update allergies.' }
  }
}
