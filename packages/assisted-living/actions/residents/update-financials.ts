'use server'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/firestore-server'
import {
  FinancialTransaction,
  EncryptedFinancialTransactionSchema,
} from '@/types'
import { getAuthenticatedAppForUser } from '@/auth/server/auth'
import {
  encryptData,
  generateDataKey,
  KEK_FINANCIAL_PATH,
} from '@/lib/encryption'

export async function updateFinancials(
  financials: FinancialTransaction[],
  residentId: string,
): Promise<{ success: boolean; message: string }> {
  const { currentUser } = await getAuthenticatedAppForUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  try {
    const { plaintextDek: financialDek } =
      await generateDataKey(KEK_FINANCIAL_PATH)

    const encryptedFinancials = financials.map((item) => {
      const enc: any = {}
      if (item.amount)
        enc.encrypted_amount = encryptData(item.amount.toString(), financialDek)
      if (item.date) enc.encrypted_date = encryptData(item.date, financialDek)
      if (item.type) enc.encrypted_type = encryptData(item.type, financialDek)
      if (item.description)
        enc.encrypted_description = encryptData(item.description, financialDek)
      return EncryptedFinancialTransactionSchema.parse(enc)
    })

    const residentRef = doc(db, 'residents', residentId)
    await updateDoc(residentRef, {
      encrypted_financials: encryptedFinancials,
    })

    return { success: true, message: 'Financials updated successfully.' }
  } catch (error) {
    console.error('Error updating financials: ', error)
    return { success: false, message: 'Failed to update financials.' }
  }
}
