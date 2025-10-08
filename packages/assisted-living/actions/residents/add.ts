'use server'
import { collectionWrapper } from '@/firebase/firestore'
import db from '@/firebase/server/config'
import { Resident, createResidentConverter } from '@/types'
import { verifySessionCookie } from '@/firebase/auth/server/definitions'

export async function addNewResident(
  residentData: Omit<Resident, 'resident_id'>,
  idToken: string,
) {
  try {
    const decodedClaims = await getVerifiedSessionCookie(idToken)
    const userRoles: string[] = decodedClaims.claims.roles || []

    await db.runTransaction(async (transaction) => {
      const metadataRef = collectionWrapper('metadata').doc('lastResidentID')
      const metadataSnap = await transaction.get(metadataRef)
      if (!metadataSnap.exists)
        throw new Error('lastResidentID metadata not found')
      const { resident_id: oldResidentId } = metadataSnap.data() as {
        resident_id: string
      }
      const resident_id = (parseInt(oldResidentId) + 1).toString()
      const resident: Resident = {
        ...residentData,
        resident_id,
      }
      const residentRef = collectionWrapper('residents')
        .withConverter(createResidentConverter(userRoles))
        .doc()

      transaction.set(residentRef, resident)
      transaction.update(metadataRef, { resident_id })
    })
    return {
      message: 'Successfully Added a New Resident',
      success: true,
    }
  } catch (error) {
    console.error('Failed to Add a New Resident.', error)
    return {
      success: false,
      message: 'Failed to Add a New Resident',
    }
  }
}
