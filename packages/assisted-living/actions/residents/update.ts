'use server'
import {
  collectionWrapper,
  docWrapper,
  updateDocWrapper,
} from '#root/firebase/admin'
import { Resident } from '#root/types/schemas/administrative/resident'
import { EncryptedResidentSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import { encryptResident, getResidentConverter } from '#root/types/converters'
import { z } from 'zod'

export async function updateResident(
  newResidentData: Partial<Resident>,
  documentId: string,
) {
  try {
    const { provider_id } = await verifySession() // Authenticate the request first

    const encryptedResident = await encryptResident(newResidentData)

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
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
