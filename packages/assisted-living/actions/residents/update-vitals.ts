'use server'
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { Vital, EncryptedVitalSchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateVitals(
  vitals: Vital[],
  residentId: string,
  deletedVitalIds: string[] = [],
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
    const vitalsRef = collection(db, 'residents', residentId, 'vitals')

    vitals.forEach((vital) => {
      const { id, ...vitalData } = vital
      const docRef = id ? doc(vitalsRef, id) : doc(vitalsRef)

      const encryptedVital: any = {}
      if (vitalData.date)
        encryptedVital.encrypted_date = encryptData(vitalData.date, clinicalDek)
      if (vitalData.loinc_code)
        encryptedVital.encrypted_loinc_code = encryptData(
          vitalData.loinc_code,
          clinicalDek,
        )
      if (vitalData.name)
        encryptedVital.encrypted_name = encryptData(vitalData.name, clinicalDek)
      if (vitalData.value)
        encryptedVital.encrypted_value = encryptData(
          vitalData.value,
          clinicalDek,
        )
      if (vitalData.unit)
        encryptedVital.encrypted_unit = encryptData(vitalData.unit, clinicalDek)

      batch.set(docRef, EncryptedVitalSchema.parse(encryptedVital), {
        merge: true,
      })
    })

    deletedVitalIds.forEach((id) => {
      const docRef = doc(vitalsRef, id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Vitals updated successfully.' }
  } catch (error) {
    console.error('Error updating vitals: ', error)
    return { success: false, message: 'Failed to update vitals.' }
  }
}
