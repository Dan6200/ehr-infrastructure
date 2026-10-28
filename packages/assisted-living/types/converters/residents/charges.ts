'use server'
import { decryptDataKey, decryptData } from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { EncryptedChargeSchema } from '#root/types/encrypted-schemas'
import { ChargeSchema } from '#root/types/schemas/financial/charge'
import z from 'zod'
import { chargeCodec } from './codecs'
import { toPatientReference } from '#root/types/schemas/fhir/reference'

export async function decryptCharge(
  data: z.infer<typeof EncryptedChargeSchema>,
  kekPath: string,
): Promise<z.infer<typeof ChargeSchema>> {
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

  if (decryptedData.unit_price) {
    const parsed = JSON.parse(decryptedData.unit_price)
    if (typeof parsed.value === 'number') {
      parsed.value = parseFloat(parsed.value.toFixed(2))
    }
    decryptedData.unit_price = parsed
  }
  if (decryptedData.quantity) {
    decryptedData.quantity = parseInt(decryptedData.quantity, 10)
  }

  decryptedData.subject = toPatientReference(decryptedData.resident_id)
  return ChargeSchema.parse(decryptedData)
}

export const getChargesConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof chargeCodec.storedSchema>>
> => ({
  toFirestore(charge: z.infer<typeof chargeCodec.storedSchema>): DocumentData {
    return chargeCodec.storedSchema.parse(charge)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof chargeCodec.storedSchema> {
    return chargeCodec.storedSchema.parse(snapshot.data())
  },
})
