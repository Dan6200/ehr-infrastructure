'use server'
import { collectionWrapper } from '@/firebase/firestore'
import db from '@/firebase/server/config'
import { notFound } from 'next/navigation'

export async function deleteResidentData(documentId: string) {
  try {
    await db.runTransaction(async (transaction) => {
      const residentDocRef = collectionWrapper('residents').doc(documentId)
      const resSnap = await transaction.get(residentDocRef)
      if (!resSnap.exists) throw notFound()

      transaction.delete(resSnap.ref)
    })
    return { success: true, message: 'Successfully Deleted Resident' }
  } catch (error) {
    console.error('Failed to Delete the Resident.', error)
    return {
      success: false,
      message: 'Failed to Delete the Resident.',
    }
  }
}
