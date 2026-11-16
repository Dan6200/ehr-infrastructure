'use server'
import { collectionWrapper, docWrapper, getAdminDb } from '#root/firebase/admin'
import { verifySession } from '#root/auth/server/definitions'
import { EncryptedResidentSchema } from '#root/types/encrypted-schemas'
import { getResidentConverter } from '#root/types/converters/residents/main'
import { z } from 'zod'

export async function deleteResidentData(documentId: string) {
  try {
    const { provider_id } = await verifySession() // Authenticate the request first

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
    ).withConverter(await getResidentConverter())

    const residentDocRef = await docWrapper(residentsCollection, documentId)

    const adminDb = await getAdminDb()
    await adminDb.recursiveDelete(residentDocRef)

    return { success: true, message: 'Successfully Deleted Resident' }
  } catch (error: any) {
    console.error('Failed to Delete the Resident:', error)
    return {
      success: false,
      message: error.message || 'Failed to Delete the Resident.',
    }
  }
}
