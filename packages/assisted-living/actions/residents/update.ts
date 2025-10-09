'use server'
import { collectionWrapper } from '@/firebase/firestore-server'
import { Resident, createResidentConverter } from '@/types'
import { notFound } from 'next/navigation'
import { getAuthenticatedAppAndClaims } from '@/firebase/auth/server/definitions'

export async function updateResident(
  newResidentData: Resident,
  documentId: string,
) {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken.claims?.roles as string[]) || []

    // We need to get the Firestore instance from the FirebaseServerApp
    // and then use it to run the transaction.
    // For now, we'll use the collectionWrapper directly with the app instance.
    const residentsCollection = collectionWrapper(
      app,
      'residents',
    ).withConverter(createResidentConverter(userRoles))

    const residentRef = residentsCollection.doc(documentId)

    // Transactions in Firebase Admin SDK (which FirebaseServerApp uses for Firestore) are slightly different.
    // They don't directly take a `db` instance from `firebase/server/config`.
    // Instead, you operate on references obtained from the `FirebaseServerApp`'s Firestore instance.
    await residentRef.update({ ...newResidentData })

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
