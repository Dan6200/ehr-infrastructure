'use server'
import { addDocWrapper, collectionWrapper } from '#root/firebase/admin'
import { EncryptedResidentSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import { encryptResident, getResidentConverter } from '#root/types/converters'
import { z } from 'zod'
import { Resident } from '#root/types'

export async function addNewResident(
  residentData: Omit<Resident, 'resident_id'>,
) {
  try {
    const { provider_id } = await verifySession() // Authenticate the request first

    const resident: Resident = residentData

    const encryptedResident = await encryptResident(resident)

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
    ).withConverter(await getResidentConverter())

    await addDocWrapper(residentsCollection, encryptedResident)

    return {
      message: 'Successfully Added a New Resident',
      success: true,
    }
  } catch (error: any) {
    console.error('Failed to Add a New Resident.', error)
    return {
      success: false,
      message: error.message || 'Failed to Add a New Resident',
    }
  }
}
