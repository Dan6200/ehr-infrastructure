'use server'
import { decryptDataKey, decryptData } from '#/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedProcedureSchema, ProcedureSchema } from '#/types'
import z from 'zod'

export async function decryptProcedure(
  data: z.infer<typeof EncryptedProcedureSchema>,
  kekPath: string,
): Promise<z.infer<typeof ProcedureSchema>> {
  const dek = await decryptDataKey(
    Buffer.from(data.encrypted_dek, 'base64'),
    kekPath,
  )
  const decryptedData: any = {}

  for (const key in data) {
    if (key === 'id' || key.endsWith('_id')) {
      decryptedData[key] = (data as any)[key]
    } else if (key === 'performer') {
      // Handle partially encrypted performer object
      decryptedData.performer = {
        id: data.performer.id,
        name: !!data.performer.encrypted_name
          ? decryptData(data.performer.encrypted_name, dek)
          : null,
        period: JSON.parse(decryptData(data.performer.encrypted_period, dek)),
      }
    } else if (
      key.startsWith('encrypted_') &&
      key !== 'encrypted_dek' &&
      !!(data as any)[key]
    ) {
      const newKey = key.replace('encrypted_', '')
      decryptedData[newKey] = decryptData((data as any)[key], dek)
    }
  }

  if (decryptedData.code) {
    decryptedData.code = JSON.parse(decryptedData.code)
  }
  if (decryptedData.occurrence) {
    decryptedData.occurrence = JSON.parse(decryptedData.occurrence)
  }
  if (decryptedData.category) {
    decryptedData.category = JSON.parse(decryptedData.category)
  }
  if (decryptedData.body_site) {
    decryptedData.body_site = JSON.parse(decryptedData.body_site)
  }

  return ProcedureSchema.parse(decryptedData)
}

export const getProceduresConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedProcedureSchema>>
> => ({
  toFirestore(
    procedure: z.infer<typeof EncryptedProcedureSchema>,
  ): DocumentData {
    return EncryptedProcedureSchema.parse(procedure)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedProcedureSchema> {
    return EncryptedProcedureSchema.parse(snapshot.data())
  },
})
