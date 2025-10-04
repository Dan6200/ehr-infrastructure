'use server'
import { collectionWrapper } from '@/firebase/firestore'
import db from '@/firebase/server/config'
import { Resident, createResidentConverter } from '@/types' // Import createResidentConverter
import { notFound } from 'next/navigation'
import { getEncryptionKey } from '@/app/admin/actions/get-encryption-key' // Import getEncryptionKey

export async function updateResident(
  newResidentData: Resident,
  documentId: string,
  idToken: string, // Accept idToken as an argument
) {
  try {
    // Fetch the encryption key
    const { key: encryptionKey, error: keyError } =
      await getEncryptionKey(idToken)
    if (keyError || !encryptionKey) {
      console.error('Failed to retrieve encryption key:', keyError)
      return {
        success: false,
        message: 'Failed to update resident: Encryption key not available.',
      }
    }

    await db.runTransaction(async (transaction) => {
      const residentRef = collectionWrapper('residents')
        .withConverter(createResidentConverter(encryptionKey)) // Use createResidentConverter
        .doc(documentId)
      const resSnap = await transaction.get(residentRef)
      if (!resSnap.exists) throw notFound()
      transaction.update(residentRef, { ...newResidentData })
    })
    return {
      success: true,
      message: 'Successfully Updated Resident Information',
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to Update the Resident',
    }
  }
}
