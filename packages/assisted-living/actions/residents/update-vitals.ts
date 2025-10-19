'use server'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { Vital, EncryptedVitalSchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  encryptData,
  generateDataKey,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateVitals(
  vitals: Vital[],
  residentId: string,
): Promise<{ success: boolean; message: string }> {
  const { currentUser } = await getAuthenticatedAppForUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  try {
    const { plaintextDek: clinicalDek } =
      await generateDataKey(KEK_CLINICAL_PATH)

    const encryptedVitals = vitals.map((vital) => {
      const enc: any = {}
      if (vital.date) enc.encrypted_date = encryptData(vital.date, clinicalDek)
      if (vital.loinc_code)
        enc.encrypted_loinc_code = encryptData(vital.loinc_code, clinicalDek)
      if (vital.value)
        enc.encrypted_value = encryptData(vital.value, clinicalDek)
      if (vital.unit) enc.encrypted_unit = encryptData(vital.unit, clinicalDek)
      return EncryptedVitalSchema.parse(enc)
    })

    const residentRef = doc(db, 'residents', residentId)
    await updateDoc(residentRef, {
      encrypted_vitals: encryptedVitals,
    })

    return { success: true, message: 'Vitals updated successfully.' }
  } catch (error) {
    console.error('Error updating vitals: ', error)
    return { success: false, message: 'Failed to update vitals.' }
  }
}
