'use server'
import {
  collectionWrapper,
  docWrapper,
  getDocWrapper,
  updateDocWrapper,
} from '@/firebase/firestore-server'
import { Resident, EncryptedResident } from '@/types'
import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import { encryptResident, getResidentConverter } from '@/types/converters'

export async function updateResident(
  newResidentData: Resident,
  documentId: string,
) {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app } = authenticatedApp

    const encryptedResident = await encryptResident(newResidentData)

    await updateDocWrapper(
      await docWrapper(
        (
          await collectionWrapper<EncryptedResident>(app, 'residents')
        ).withConverter(await getResidentConverter()),
        documentId,
      ),
      encryptedResident,
    )

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
