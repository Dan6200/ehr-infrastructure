'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Payment } from '#root/types/schemas/financial/payment'
import { EncryptedPaymentSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption'

export async function updatePayments(
  payments: (Omit<Payment, 'resident_id'> & { id?: string })[],
  residentId: string,
  deletedPaymentIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  const { provider_id } = await verifySession()

  try {
    const adminDb = await getAdminDb()
    const residentRef = adminDb
      .collection(`providers/${provider_id}/residents`)
      .doc(residentId)
    const residentSnap = await residentRef.get()
    if (!residentSnap.exists) {
      throw new Error('Resident not found')
    }

    const encryptedDek = residentSnap.data()?.encrypted_dek_financial
    if (!encryptedDek) {
      throw new Error('Financial DEK not found for resident')
    }

    const financialDek = await decryptDataKey(
      Buffer.from(encryptedDek, 'base64'),
      KEK_FINANCIAL_PATH,
    )

    const batch = adminDb.batch()
    const paymentsRef = residentRef.collection('payments')

    payments.forEach((payment) => {
      const { id, ...paymentData } = payment
      const docRef = id ? paymentsRef.doc(id) : paymentsRef.doc()

      const encryptedPayment: any = {
        resident_id: residentId,
        claim_id: paymentData.claim_id,
        coverage_id: paymentData.coverage_id,
        encrypted_dek: encryptedDek,
      }

      if (paymentData.amount)
        encryptedPayment.encrypted_amount = encryptData(
          JSON.stringify(paymentData.amount),
          financialDek,
        )
      if (paymentData.payor)
        encryptedPayment.encrypted_payor = encryptData(
          paymentData.payor,
          financialDek,
        )
      if (paymentData.occurrence_datetime)
        encryptedPayment.encrypted_occurrence_datetime = encryptData(
          paymentData.occurrence_datetime,
          financialDek,
        )
      if (paymentData.method)
        encryptedPayment.encrypted_method = encryptData(
          paymentData.method,
          financialDek,
        )

      batch.set(docRef, EncryptedPaymentSchema.parse(encryptedPayment), {
        merge: true,
      })
    })

    deletedPaymentIds.forEach((id) => {
      const docRef = paymentsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Payments updated successfully.' }
  } catch (error) {
    console.error('Error updating payments: ', error)
    return { success: false, message: 'Failed to update payments.' }
  }
}
