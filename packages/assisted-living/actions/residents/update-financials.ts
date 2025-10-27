'use server'
import { adminDb } from '@/firebase/admin'
import {
  FinancialTransaction,
  EncryptedFinancialTransactionSchema,
} from '@/types'
import { verifySession } from '@/auth/server/definitions'
import {
  decryptDataKey,
  encryptData,
  KEK_FINANCIAL_PATH,
} from '@/lib/encryption'

export async function updateFinancials(
  financials: (FinancialTransaction & { id: string })[],
  residentId: string,
  deletedFinancialIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  await verifySession()

  try {
    const residentRef = adminDb
      .collection('providers/GYRHOME/residents')
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
    const financialsRef = residentRef.collection('financials')

    financials.forEach((item) => {
      const { id, ...itemData } = item
      const docRef = id ? financialsRef.doc(id) : financialsRef.doc()

      const encryptedFinancial: any = { encrypted_dek: encryptedDek }

      if (itemData.amount)
        encryptedFinancial.encrypted_amount = encryptData(
          itemData.amount.toString(),
          financialDek,
        )
      if (itemData.occurrence_datetime)
        // Corrected field name
        encryptedFinancial.encrypted_occurrence_datetime = encryptData(
          itemData.occurrence_datetime,
          financialDek,
        )
      if (itemData.type)
        encryptedFinancial.encrypted_type = encryptData(
          itemData.type,
          financialDek,
        )
      if (itemData.description)
        encryptedFinancial.encrypted_description = encryptData(
          itemData.description,
          financialDek,
        )

      batch.set(
        docRef,
        EncryptedFinancialTransactionSchema.parse(encryptedFinancial),
        { merge: true },
      )
    })

    deletedFinancialIds.forEach((id) => {
      const docRef = financialsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Financials updated successfully.' }
  } catch (error) {
    console.error('Error updating financials: ', error)
    return { success: false, message: 'Failed to update financials.' }
  }
}
