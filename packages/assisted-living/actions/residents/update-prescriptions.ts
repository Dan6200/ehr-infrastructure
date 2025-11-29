'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Prescription } from '#root/types/schemas/clinical/prescription'
import { EncryptedPrescriptionSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'

export async function updatePrescriptions(
  prescriptions: (Omit<Prescription, 'resident_id' | 'recorder_id'> & {
    id?: string
  })[],
  residentId: string,
  deletedPrescriptionIds: string[] = [],
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
    const prescriptionsRef = residentRef.collection('prescriptions')

    prescriptions.forEach((prescription) => {
      const { id, ...prescriptionData } = prescription
      const docRef = id ? prescriptionsRef.doc(id) : prescriptionsRef.doc()

      const encryptedPrescription: any = {}

      if (prescriptionData.period)
        encryptedPrescription.encrypted_period = encryptData(
          JSON.stringify(prescriptionData.period),
          clinicalDek,
        )
      if (prescriptionData.status)
        encryptedPrescription.encrypted_status = encryptData(
          prescriptionData.status,
          clinicalDek,
        )
      if (prescriptionData.adherence)
        encryptedPrescription.encrypted_adherence = encryptData(
          prescriptionData.adherence,
          clinicalDek,
        )
      if (prescriptionData.medication)
        encryptedPrescription.encrypted_medication = encryptData(
          JSON.stringify(prescriptionData.medication),
          clinicalDek,
        )
      if (prescriptionData.dosage_instruction)
        encryptedPrescription.encrypted_dosage_instruction = encryptData(
          JSON.stringify(prescriptionData.dosage_instruction),
          clinicalDek,
        )

      batch.set(
        docRef,
        EncryptedPrescriptionSchema.parse(encryptedPrescription),
        { merge: true },
      )
    })

    deletedPrescriptionIds.forEach((id) => {
      const docRef = prescriptionsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Prescriptions updated successfully.' }
  } catch (error) {
    console.error('Error updating prescriptions: ', error)
    return { success: false, message: 'Failed to update prescriptions.' }
  }
}
