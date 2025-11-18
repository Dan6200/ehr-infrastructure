'use server'
import { KEK_CONTACT_PATH, decryptDataKey, decryptData } from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import {
  EncryptedEmergencyContactSchema,
  EmergencyContactSchema,
} from '@/types'
import z from 'zod'

export async function decryptEmergencyContact(
  data: z.infer<typeof EncryptedEmergencyContactSchema>,
  kekPath: string,
): Promise<z.infer<typeof EmergencyContactSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id')) {
      decryptedData[key] = (data as any)[key]
    } else if (
      key.startsWith('encrypted_') &&
      key !== 'encrypted_dek' &&
      !!(data as any)[key]
    ) {
      const newKey = key.replace('encrypted_', '')
      decryptedData[newKey] = decryptData((data as any)[key], dek)
    }
  }

  if (decryptedData.relationship) {
    decryptedData.relationship = JSON.parse(decryptedData.relationship)
  }
  return EmergencyContactSchema.parse(decryptedData)
}

export const getEmergencyContactsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedEmergencyContactSchema>>
> => ({
  toFirestore(
    contact: z.infer<typeof EncryptedEmergencyContactSchema>,
  ): DocumentData {
    return EncryptedEmergencyContactSchema.parse(contact)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedEmergencyContactSchema> {
    return EncryptedEmergencyContactSchema.parse(snapshot.data())
  },
})
