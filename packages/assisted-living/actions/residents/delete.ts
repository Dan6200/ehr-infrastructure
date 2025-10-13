'use server'
import {
  collectionWrapper,
  deleteDocWrapper,
  docWrapper,
} from '@/firebase/firestore-server'
import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import { EncryptedResident } from '@/types'
import { getResidentConverter } from '@/types/converters'

export async function deleteResidentData(documentId: string) {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app } = authenticatedApp

    await deleteDocWrapper(
      await docWrapper(
        (
          await collectionWrapper<EncryptedResident>(app, 'residents')
        ).withConverter(await getResidentConverter()),
        documentId,
      ),
    )

    return { success: true, message: 'Successfully Deleted Resident' }
  } catch (error: any) {
    console.error('Failed to Delete the Resident:', error)
    return {
      success: false,
      message: error.message || 'Failed to Delete the Resident.',
    }
  }
}
