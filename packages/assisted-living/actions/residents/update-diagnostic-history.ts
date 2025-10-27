import { getAdminDb } from '@/firebase/admin'
import { DiagnosticHistory, EncryptedDiagnosticHistorySchema } from '@/types'
import { verifySession } from '@/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateDiagnosticHistory(
  records: (DiagnosticHistory & { id: string })[],
  residentId: string,
  deletedRecordIds: string[] = [],
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
    const recordsRef = residentRef.collection('diagnostic_history')

    records.forEach((record) => {
      const { id, ...recordData } = record
      const docRef = id ? recordsRef.doc(id) : recordsRef.doc()

      const encryptedRecord: any = {}
      if (recordData.date)
        encryptedRecord.encrypted_date = encryptData(
          recordData.date,
          clinicalDek,
        )
      if (recordData.title)
        encryptedRecord.encrypted_title = encryptData(
          recordData.title,
          clinicalDek,
        )
      if (recordData.notes)
        encryptedRecord.encrypted_notes = encryptData(
          recordData.notes,
          clinicalDek,
        )
      if (recordData.snomed_code)
        encryptedRecord.encrypted_snomed_code = encryptData(
          recordData.snomed_code,
          clinicalDek,
        )

      batch.set(
        docRef,
        EncryptedDiagnosticHistorySchema.parse(encryptedRecord),
        { merge: true },
      )
    })

    deletedRecordIds.forEach((id) => {
      const docRef = recordsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return {
      success: true,
      message: 'Diagnostic history updated successfully.',
    }
  } catch (error) {
    console.error('Error updating diagnostic history: ', error)
    return { success: false, message: 'Failed to update diagnostic history.' }
  }
}
