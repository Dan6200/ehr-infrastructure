'use server'
import {
  collectionWrapper,
  docWrapper,
  updateDocWrapper,
} from '#root/firebase/admin'
import { Resident } from '#root/types/schemas/administrative/resident'
import { EncryptedResidentSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import { canAccessKekType } from '#root/lib/access-control'
import {
  encryptResident,
  getResidentConverter,
} from '#root/types/converters/residents/main'
import { z } from 'zod'

export async function updateResident(
  newResidentData: Partial<Resident>,
  documentId: string,
) {
  try {
    const { provider_id, roles = [] } = await verifySession() // Authenticate the request first

    if (newResidentData.pcp && !canAccessKekType(roles, 'clinical')) {
      return {
        success: false,
        message: 'Insufficient permissions to modify clinical data.',
      }
    }

    const contactFields: (keyof Resident)[] = [
      'dob',
      'resident_email',
      'cell_phone',
      'work_phone',
      'home_phone',
    ]
    if (
      contactFields.some((field) => newResidentData[field]) &&
      !canAccessKekType(roles, 'contact')
    ) {
      return {
        success: false,
        message: 'Insufficient permissions to modify contact data.',
      }
    }

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
