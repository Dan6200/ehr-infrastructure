'use server'
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import { DiagnosticHistory, EncryptedDiagnosticHistorySchema } from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

export async function updateDiagnosticHistory(
  records: DiagnosticHistory[],
  residentId: string,
  deletedRecordIds: string[] = [],
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
    const recordsRef = collection(
      db,
      'residents',
      residentId,
      'diagnostic_history',
    )

    records.forEach((record) => {
      const { id, ...recordData } = record
      const docRef = id ? doc(recordsRef, id) : doc(recordsRef)

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
      const docRef = doc(recordsRef, id)
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
