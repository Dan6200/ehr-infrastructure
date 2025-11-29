'use server'
import { getAdminDb } from '#root/firebase/admin'
import { DiagnosticHistory } from '#root/types/schemas/clinical/diagnostic-history'
import { EncryptedDiagnosticHistorySchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'

export async function updateDiagnosticHistory(
  records: (Omit<DiagnosticHistory, 'resident_id' | 'recorder_id'> & {
    id?: string
  })[],
  residentId: string,
  deletedRecordIds: string[] = [],
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
    const recordsRef = residentRef.collection('diagnostic_history')

    records.forEach((record) => {
      const { id, ...recordData } = record
      const docRef = id ? recordsRef.doc(id) : recordsRef.doc()

      const encryptedRecord: any = {}

      if (recordData.clinical_status)
        encryptedRecord.encrypted_clinical_status = encryptData(
          recordData.clinical_status,
          clinicalDek,
        )
      if (recordData.recorded_date)
        encryptedRecord.encrypted_recorded_date = encryptData(
          recordData.recorded_date,
          clinicalDek,
        )
      if (recordData.onset_datetime)
        encryptedRecord.encrypted_onset_datetime = encryptData(
          recordData.onset_datetime,
          clinicalDek,
        )
      if (recordData.abatement_datetime)
        encryptedRecord.encrypted_abatement_datetime = encryptData(
          recordData.abatement_datetime,
          clinicalDek,
        )
      if (recordData.title)
        encryptedRecord.encrypted_title = encryptData(
          recordData.title,
          clinicalDek,
        )
      if (recordData.code)
        encryptedRecord.encrypted_code = encryptData(
          JSON.stringify(recordData.code),
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
