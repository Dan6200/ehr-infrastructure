'use server'
import {
  collectionWrapper,
  docWrapper,
  updateDocWrapper,
} from '#/firebase/admin'
import { Resident, EncryptedResident } from '#/types'
import { verifySession } from '#/auth/server/definitions'
import { encryptResident, getResidentConverter } from '#/types/converters'

export async function updateResident(
  newResidentData: Resident,
  documentId: string,
) {
  try {
    await verifySession() // Authenticate the request first

    const encryptedResident = await encryptResident(newResidentData)

    const residentsCollection = (
      await collectionWrapper<EncryptedResident>('providers/GYRHOME/residents')
    ).withConverter(await getResidentConverter())

    const residentDocRef = await docWrapper(residentsCollection, documentId)

    await updateDocWrapper(residentDocRef, encryptedResident)

    return {
      success: true,
      message: 'Successfully Updated Resident Information',
    }
  } catch (error: any) {
    console.error('Failed to Update the Resident:', error)
    return {
      success: false,
      message: error.message || 'Failed to Update the Resident',
    }
  }
}
