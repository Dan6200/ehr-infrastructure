import { getAdminDb } from '@/firebase/admin'
import { EmergencyContact, EncryptedEmergencyContactSchema } from '@/types'
import { verifySession } from '@/auth/server/definitions'
import { decryptDataKey, encryptData, KEK_CONTACT_PATH } from '@/lib/encryption'

export async function updateEmergencyContacts(
  contacts: (EmergencyContact & { id: string })[],
  residentId: string,
  deletedContactIds: string[] = [],
): Promise<{ success: boolean; message: string }> {
  await verifySession()

  try {
    const adminDb = await getAdminDb()
    const residentRef = adminDb
      .collection('providers/GYRHOME/residents')
      .doc(residentId)
    const residentSnap = await residentRef.get()
    if (!residentSnap.exists) {
      throw new Error('Resident not found')
    }

    const residentData = residentSnap.data()
    const encryptedDek = residentData?.encrypted_dek_contact
    if (!encryptedDek) {
      throw new Error('Contact DEK not found for resident')
    }

    const contactDek = await decryptDataKey(
      Buffer.from(encryptedDek, 'base64'),
      KEK_CONTACT_PATH,
    )

    const batch = adminDb.batch()
    const contactsRef = residentRef.collection('emergency_contacts')

    // Handle creations and updates
    contacts.forEach((contact) => {
      const { id, ...contactData } = contact
      const docRef = id ? contactsRef.doc(id) : contactsRef.doc()

      // Create the base encrypted object, including the DEK
      const encryptedContact: any = { encrypted_dek: encryptedDek }

      // Encrypt all fields based on the Zod schema
      if (contactData.contact_name)
        encryptedContact.encrypted_contact_name = encryptData(
          contactData.contact_name,
          contactDek,
        )
      if (contactData.cell_phone)
        encryptedContact.encrypted_cell_phone = encryptData(
          contactData.cell_phone,
          contactDek,
        )
      if (contactData.work_phone)
        encryptedContact.encrypted_work_phone = encryptData(
          contactData.work_phone,
          contactDek,
        )
      if (contactData.home_phone)
        encryptedContact.encrypted_home_phone = encryptData(
          contactData.home_phone,
          contactDek,
        )
      if (contactData.relationship)
        encryptedContact.encrypted_relationship = encryptData(
          JSON.stringify(contactData.relationship),
          contactDek,
        )

      batch.set(
        docRef,
        EncryptedEmergencyContactSchema.parse(encryptedContact),
        { merge: true },
      )
    })

    // Handle deletions
    deletedContactIds.forEach((id) => {
      const docRef = contactsRef.doc(id)
      batch.delete(docRef)
    })

    await batch.commit()

    return {
      success: true,
      message: 'Emergency contacts updated successfully.',
    }
  } catch (error) {
    console.error('Error updating emergency contacts: ', error)
    return { success: false, message: 'Failed to update emergency contacts.' }
  }
}
