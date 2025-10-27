'use server'
import { adminDb } from '@/firebase/admin'
import { Prescription, EncryptedPrescriptionSchema } from '@/types'
import { verifySession } from '@/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updatePrescriptions(
  prescriptions: (Prescription & { id: string })[],
  residentId: string,
  deletedPrescriptionIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  await verifySession()

  try {
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
    const prescriptionsRef = residentRef.collection('prescriptions')

    prescriptions.forEach((prescription) => {
      const { id, ...prescriptionData } = prescription
      const docRef = id ? prescriptionsRef.doc(id) : prescriptionsRef.doc()

      const encryptedPrescription: any = { encrypted_dek: encryptedDek }

      if (prescriptionData.effective_period_start)
        encryptedPrescription.encrypted_effective_period_start = encryptData(
          prescriptionData.effective_period_start,
          clinicalDek,
        )
      if (prescriptionData.effective_period_end)
        encryptedPrescription.encrypted_effective_period_end = encryptData(
          prescriptionData.effective_period_end,
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
      if (prescriptionData.dosageInstruction)
        encryptedPrescription.encrypted_dosageInstruction = encryptData(
          JSON.stringify(prescriptionData.dosageInstruction),
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
