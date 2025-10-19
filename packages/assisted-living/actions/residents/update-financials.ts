import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import {
  FinancialTransaction,
  EncryptedFinancialTransactionSchema,
} from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  decryptDataKey,
  encryptData,
  KEK_FINANCIAL_PATH,
} from '@/lib/encryption'

export async function updateFinancials(
  financials: FinancialTransaction[],
  residentId: string,
  deletedFinancialIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  const { currentUser } = await getAuthenticatedAppForUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  try {
    const residentRef = doc(db, 'residents', residentId)
    const residentSnap = await getDoc(residentRef)
    if (!residentSnap.exists()) {
      throw new Error('Resident not found')
    }

    const encryptedDek = residentSnap.data().encrypted_dek_financial
    if (!encryptedDek) {
      throw new Error('Financial DEK not found for resident')
    }

    const financialDek = await decryptDataKey(
      Buffer.from(encryptedDek, 'base64'),
      KEK_FINANCIAL_PATH,
    )

    const batch = writeBatch(db)
    const financialsRef = collection(db, 'residents', residentId, 'financials')

    financials.forEach((item) => {
      const { id, ...itemData } = item
      const docRef = id ? doc(financialsRef, id) : doc(financialsRef)

      const encryptedFinancial: any = {}
      if (itemData.amount)
        encryptedFinancial.encrypted_amount = encryptData(
          itemData.amount.toString(),
          financialDek,
        )
      if (itemData.date)
        encryptedFinancial.encrypted_date = encryptData(
          itemData.date,
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
      const docRef = doc(financialsRef, id)
      batch.delete(docRef)
    })

    await batch.commit()

    return { success: true, message: 'Financials updated successfully.' }
  } catch (error) {
    console.error('Error updating financials: ', error)
    return { success: false, message: 'Failed to update financials.' }
  }
}
