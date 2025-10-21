'use server'
import { collection, addDoc } from 'firebase/firestore'
import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import { Administration } from '@/types'
import {
  generateDataKey,
  encryptData,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'
import { collectionWrapper } from '@/firebase/firestore-server'

// Helper to encrypt a single field's value
function encryptField(value: string | number, dek: Buffer) {
  if (value === null || typeof value === 'undefined') {
    return null
  }
  const { ciphertext, iv, authTag } = encryptData(String(value), dek)
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

export async function recordAdministration(
  residentId: string,
  administration: Administration,
): Promise<{ success: boolean; message: string }> {
  const authenticatedApp = await getAuthenticatedAppAndClaims()
  if (!authenticatedApp) {
    throw new Error('Not authenticated')
  }
  const { app } = authenticatedApp

  try {
    // 1. Generate a new DEK for this record, and encrypt it with the Clinical KEK
    const { plaintextDek, encryptedDek } =
      await generateDataKey(KEK_CLINICAL_PATH)

    // 2. Encrypt the fields of the administration record
    const encryptedAdminRecord: { [key: string]: any } = {
      resident_id: residentId,
      encrypted_dek: encryptedDek.toString('base64'),
    }

    // TODO: don't encrypt every key...
    for (const key in administration) {
      const value = (administration as any)[key]
      if (value) {
        encryptedAdminRecord[`encrypted_${key}`] = encryptField(
          value,
          plaintextDek,
        )
      }
    }

    // 3. Add the new encrypted document to the 'medication_administration' subcollection
    const emarCollectionRef = collectionWrapper(
      app,
      `providers/GYRHOME/residents/${residentId}/prescription_administration`,
    )
    await addDoc(emarCollectionRef, encryptedAdminRecord)

    return { success: true, message: 'Administration recorded successfully.' }
  } catch (error) {
    console.error('Error recording administration: ', error)
    return { success: false, message: 'Failed to record administration.' }
  }
}
