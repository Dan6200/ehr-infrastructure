'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Adjustment } from '#root/types/schemas/financial/adjustment'
import { EncryptedAdjustmentSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption'

export async function updateAdjustments(
  adjustments: (Omit<Adjustment, 'resident_id'> & { id?: string })[],
  residentId: string,
  deletedAdjustmentIds: string[] = [],
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
    const adjustmentsRef = residentRef.collection('adjustments')

    adjustments.forEach((adjustment) => {
      const { id, ...adjustmentData } = adjustment
      const docRef = id ? adjustmentsRef.doc(id) : adjustmentsRef.doc()

      const encryptedAdjustment: any = {
        resident_id: residentId,
        claim_id: adjustmentData.claim_id,
        coverage_id: adjustmentData.coverage_id,
        encrypted_dek: encryptedDek,
      }

      if (adjustmentData.reason)
        encryptedAdjustment.encrypted_reason = encryptData(
          adjustmentData.reason,
          financialDek,
        )
      if (adjustmentData.approved_amount)
        encryptedAdjustment.encrypted_approved_amount = encryptData(
          JSON.stringify(adjustmentData.approved_amount),
          financialDek,
        )
      if (adjustmentData.authored_on)
        encryptedAdjustment.encrypted_authored_on = encryptData(
          adjustmentData.authored_on,
          financialDek,
        )
      if (adjustmentData.updated_at)
        encryptedAdjustment.encrypted_updated_at = encryptData(
          adjustmentData.updated_at,
          financialDek,
        )

      batch.set(docRef, EncryptedAdjustmentSchema.parse(encryptedAdjustment), {
        merge: true,
      })
    })

    deletedAdjustmentIds.forEach((id) => {
      const docRef = adjustmentsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Adjustments updated successfully.' }
  } catch (error) {
    console.error('Error updating adjustments: ', error)
    return { success: false, message: 'Failed to update adjustments.' }
  }
}
