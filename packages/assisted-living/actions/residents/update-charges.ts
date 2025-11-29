'use server'
import { getAdminDb } from '#root/firebase/admin'
import { Charge } from '#root/types/schemas/financial/charge'
import { EncryptedChargeSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption'

export async function updateCharges(
  charges: (Omit<Charge, 'resident_id'> & { id?: string })[],
  residentId: string,
  deletedChargeIds: string[] = [],
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
    const chargesRef = residentRef.collection('charges')

    charges.forEach((charge) => {
      const { id, ...chargeData } = charge
      const docRef = id ? chargesRef.doc(id) : chargesRef.doc()

      const encryptedCharge: any = {
        resident_id: residentId,
        encrypted_dek: encryptedDek,
      }

      if (chargeData.service)
        encryptedCharge.encrypted_service = encryptData(
          chargeData.service,
          financialDek,
        )
      if (chargeData.code)
        encryptedCharge.encrypted_code = encryptData(
          chargeData.code,
          financialDek,
        )
      if (chargeData.quantity)
        encryptedCharge.encrypted_quantity = encryptData(
          chargeData.quantity.toString(),
          financialDek,
        )
      if (chargeData.unit_price)
        encryptedCharge.encrypted_unit_price = encryptData(
          JSON.stringify(chargeData.unit_price),
          financialDek,
        )
      if (chargeData.occurrence_datetime)
        encryptedCharge.encrypted_occurrence_datetime = encryptData(
          chargeData.occurrence_datetime,
          financialDek,
        )
      if (chargeData.description)
        encryptedCharge.encrypted_description = encryptData(
          chargeData.description,
          financialDek,
        )

      batch.set(docRef, EncryptedChargeSchema.parse(encryptedCharge), {
        merge: true,
      })
    })

    deletedChargeIds.forEach((id) => {
      const docRef = chargesRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Charges updated successfully.' }
  } catch (error) {
    console.error('Error updating charges: ', error)
    return { success: false, message: 'Failed to update charges.' }
  }
}
