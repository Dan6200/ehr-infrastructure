'use server'
import { verifySession } from '@/auth/server/definitions'
import { EmarRecord, EncryptedEmarRecordSchema } from '@/types'
import {
  decryptDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'
import { getAdminDb, collectionWrapper, addDocWrapper } from '@/firebase/admin'

export async function recordAdministration(
  residentId: string,
  administration: EmarRecord,
): Promise<{ success: boolean; message: string }> {
  await verifySession()

  try {
    const adminDb = await getAdminDb()
    // 1. Get the resident's document to retrieve the shared clinical DEK
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

    // 2. Encrypt the fields of the new administration record
    const encryptedAdminRecord: any = {
      encrypted_dek: encryptedDek, // Use the shared DEK from the parent
    }

    if (administration.medication)
      encryptedAdminRecord.encrypted_medication = encryptData(
        JSON.stringify(administration.medication),
        clinicalDek,
      )
    if (administration.status)
      encryptedAdminRecord.encrypted_status = encryptData(
        administration.status,
        clinicalDek,
      )
    if (administration.effective_datetime)
      encryptedAdminRecord.encrypted_effective_datetime = encryptData(
        administration.effective_datetime,
        clinicalDek,
      )
    if (administration.dosage)
      encryptedAdminRecord.encrypted_dosage = encryptData(
        JSON.stringify(administration.dosage),
        clinicalDek,
      )

    const parsedRecord = EncryptedEmarRecordSchema.parse(encryptedAdminRecord)

    // 3. Add the new encrypted document to the 'emar' subcollection
    const emarCollectionRef = await collectionWrapper(
      `providers/GYRHOME/residents/${residentId}/emar`,
    )
    await addDocWrapper(emarCollectionRef, parsedRecord)

    return { success: true, message: 'Administration recorded successfully.' }
  } catch (error) {
    console.error('Error recording administration: ', error)
    return { success: false, message: 'Failed to record administration.' }
  }
}
