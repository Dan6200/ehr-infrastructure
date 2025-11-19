'use server'
import { addDocWrapper, collectionWrapper } from '#/firebase/admin'
import { Resident, EncryptedResident } from '#/types'
import { verifySession } from '#/auth/server/definitions'
import { encryptResident, getResidentConverter } from '#/types/converters'

export async function addNewResident(
  residentData: Omit<Resident, 'resident_id'>,
) {
  try {
    await verifySession() // Authenticate the request first

    const resident: Resident = residentData

    const encryptedResident = await encryptResident(resident)

    const residentsCollection = (
      await collectionWrapper<EncryptedResident>('providers/GYRHOME/residents')
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
