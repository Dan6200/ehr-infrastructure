'use server'
import { getAdminDb } from '#root/firebase/admin'
import { DiagnosticHistory } from '#root/types/schemas/clinical/diagnostic-history'
import { EncryptedDiagnosticHistorySchema } from '#root/types/encrypted-schemas'
import { getCryptoProvider } from '#root/lib/crypto'
import { diagnosticHistoryCodec } from '#root/types/converters/residents/codecs'
import { verifySession } from '#root/auth/server/definitions'
import { canAccessKekType } from '#root/lib/access-control'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'

export async function updateDiagnosticHistory(
  records: (Omit<DiagnosticHistory, 'subject' | 'recorder_id'> & {
    id?: string
  })[],
  residentId: string,
  deletedRecordIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  const { provider_id, uid, roles = [] } = await verifySession()
  if (!canAccessKekType(roles, 'clinical')) {
    return {
      success: false,
      message: 'Insufficient permissions to modify clinical data.',
    }
  }
  const isPlaintext = getCryptoProvider().scheme === 'none:v1'

  try {
    const adminDb = await getAdminDb()
    const residentRef = adminDb
      .collection(`providers/${provider_id}/residents`)
      .doc(residentId)
    const residentSnap = await residentRef.get()
    if (!residentSnap.exists) {
      throw new Error('Resident not found')
    }

    let encryptedDek = ''
    let clinicalDek: Buffer | string | Uint8Array = Buffer.alloc(0)
    if (!isPlaintext) {
      const wrappedDek = residentSnap.data()?.encrypted_dek_clinical
      if (!wrappedDek) {
        throw new Error('Clinical DEK not found for resident')
      }
      encryptedDek = wrappedDek
      clinicalDek = await decryptDataKey(
        Buffer.from(wrappedDek, 'base64'),
        KEK_CLINICAL_PATH,
      )
    }

    const batch = adminDb.batch()
    const recordsRef = residentRef.collection('diagnostic_history')

    records.forEach((record) => {
      const { id, ...recordData } = record
      const docRef = id ? recordsRef.doc(id) : recordsRef.doc()

      if (isPlaintext) {
        batch.set(
          docRef,
          diagnosticHistoryCodec.domainToPlaintext(recordData, residentId, uid),
          { merge: true },
        )
        return
      }

      const encryptedRecord: any = {
        crypto_scheme: 'kms-envelope:v1',
        resident_id: residentId,
        recorder_id: uid,
        encrypted_dek: encryptedDek,
      }

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
