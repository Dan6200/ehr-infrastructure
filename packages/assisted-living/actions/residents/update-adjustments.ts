'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Adjustment } from '#root/types/schemas/financial/adjustment'
import { EncryptedAdjustmentSchema } from '#root/types/encrypted-schemas'
import { getCryptoProvider } from '#root/lib/crypto'
import { adjustmentCodec } from '#root/types/converters/residents/codecs'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption'

export async function updateAdjustments(
  adjustments: (Omit<Adjustment, 'subject'> & { id?: string })[],
  residentId: string,
  deletedAdjustmentIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  const { provider_id } = await verifySession()
  const isPlaintext = getCryptoProvider().scheme === 'none:v1'

  try {
    const adminDb = await getAdminDb()
    const residentRef = adminDb
      .collection(`providers/${provider_id}/residents`)
      .doc(residentId)
    const residentSnap = await residentRef.get()
    if (!residentSnap.exists) {
      throw new Error('Resident not found')
    }

    let encryptedDek = ''
    let financialDek: Buffer | string | Uint8Array = Buffer.alloc(0)
    if (!isPlaintext) {
      const wrappedDek = residentSnap.data()?.encrypted_dek_financial
      if (!wrappedDek) {
        throw new Error('Financial DEK not found for resident')
      }
      encryptedDek = wrappedDek
      financialDek = await decryptDataKey(
        Buffer.from(wrappedDek, 'base64'),
        KEK_FINANCIAL_PATH,
      )
    }

    const batch = adminDb.batch()
    const adjustmentsRef = residentRef.collection('adjustments')

    adjustments.forEach((adjustment) => {
      const { id, ...adjustmentData } = adjustment
      const docRef = id ? adjustmentsRef.doc(id) : adjustmentsRef.doc()

      if (isPlaintext) {
        batch.set(
          docRef,
          adjustmentCodec.domainToPlaintext(adjustmentData, residentId),
          { merge: true },
        )
        return
      }

      const encryptedAdjustment: any = {
        crypto_scheme: 'kms-envelope:v1',
        resident_id: residentId,
        claim_id: adjustmentData.claim_id,
        coverage_id: adjustmentData.coverage_id ?? null,
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
