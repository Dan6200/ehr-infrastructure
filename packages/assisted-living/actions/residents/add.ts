'use server'
import {
  addDocWrapper,
  collectionWrapper,
  docWrapper,
} from '@/firebase/firestore-server'
import { Resident, EncryptedResident } from '@/types'
import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import { encryptResident, getResidentConverter } from '@/types/converters'

export async function addNewResident(
  residentData: Omit<Resident, 'resident_id'>,
) {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app } = authenticatedApp

    const resident: Resident = residentData

    const encryptedResident = await encryptResident(resident)

    await addDocWrapper(
      (
        await collectionWrapper<EncryptedResident>(app, 'residents')
      ).withConverter(await getResidentConverter()),
      encryptedResident,
    )

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
