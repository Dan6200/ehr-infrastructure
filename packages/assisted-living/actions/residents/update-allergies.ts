'use server'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { Allergy, EncryptedAllergySchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  encryptData,
  generateDataKey,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateAllergies(
  allergies: Allergy[],
  residentId: string,
): Promise<{ success: boolean; message: string }> {
  const { currentUser } = await getAuthenticatedAppForUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  try {
    // For simplicity, we'll re-encrypt the whole array.
    // A more complex implementation might handle individual array item updates.
    const { plaintextDek: clinicalDek } =
      await generateDataKey(KEK_CLINICAL_PATH)

    const encryptedAllergies = allergies.map((allergy) => {
      const enc: any = {}
      if (allergy.name)
        enc.encrypted_name = encryptData(allergy.name, clinicalDek)
      if (allergy.snomed_code)
        enc.encrypted_snomed_code = encryptData(
          allergy.snomed_code,
          clinicalDek,
        )
      if (allergy.reaction)
        enc.encrypted_reaction = encryptData(allergy.reaction, clinicalDek)
      return EncryptedAllergySchema.parse(enc)
    })

    const residentRef = doc(db, 'residents', residentId)
    await updateDoc(residentRef, {
      encrypted_allergies: encryptedAllergies,
    })

    return { success: true, message: 'Allergies updated successfully.' }
  } catch (error) {
    console.error('Error updating allergies: ', error)
    return { success: false, message: 'Failed to update allergies.' }
  }
}
