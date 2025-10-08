'use server'
import { collectionWrapper } from '@/firebase/firestore'
import db from '@/firebase/server/config'
import { Resident, createResidentConverter } from '@/types'
import { notFound } from 'next/navigation'
import { verifySessionCookie } from '@/firebase/auth/server/definitions'

export async function updateResident(
  newResidentData: Resident,
  documentId: string,
  idToken: string,
) {
  try {
    const decodedClaims = await getVerifiedSessionCookie(idToken)
    const userRoles: string[] = decodedClaims.claims.roles || []

    await db.runTransaction(async (transaction) => {
      const residentRef = collectionWrapper('residents')
        .withConverter(createResidentConverter(userRoles))
        .doc(documentId)
      const resSnap = await transaction.get(residentRef)
      if (!resSnap.exists) throw notFound()
      transaction.update(residentRef, { ...newResidentData })
    })
    return {
      success: true,
      message: 'Successfully Updated Resident Information',
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to Update the Resident',
    }
  }
}
