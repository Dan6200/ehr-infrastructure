'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedPrescriptionSchema } from '#root/types/encrypted-schemas'
import { PrescriptionSchema } from '#root/types/schemas/clinical/prescription'
import z from 'zod'
import { prescriptionCodec } from './codecs'
import { toPatientReference } from '#root/types/schemas/fhir/reference'

export async function decryptPrescription(
  data: z.infer<typeof EncryptedPrescriptionSchema>,
  kekPath: string,
): Promise<z.infer<typeof PrescriptionSchema>> {
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

  if (decryptedData.medication) {
    decryptedData.medication = JSON.parse(decryptedData.medication)
  }
  if (decryptedData.dosageInstruction) {
    decryptedData.dosageInstruction = JSON.parse(
      decryptedData.dosageInstruction,
    )
  }

  decryptedData.subject = toPatientReference(decryptedData.resident_id)
  return PrescriptionSchema.parse(decryptedData)
}

export const getPrescriptionsConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof prescriptionCodec.storedSchema>>
> => ({
  toFirestore(
    prescription: z.infer<typeof prescriptionCodec.storedSchema>,
  ): DocumentData {
    return prescriptionCodec.storedSchema.parse(prescription)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof prescriptionCodec.storedSchema> {
    return prescriptionCodec.storedSchema.parse(snapshot.data())
  },
})
