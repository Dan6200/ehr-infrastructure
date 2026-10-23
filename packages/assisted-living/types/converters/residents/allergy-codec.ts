import { z } from 'zod'
import { AllergySchema } from '#root/types/schemas/clinical/allergy'
import { EncryptedAllergySchema } from '#root/types/encrypted-schemas'
import { toPatientReference } from '#root/types/schemas/fhir/reference'

/**
 * Plaintext storage shape for regular-EHR tenants.
 *
 * Structurally distinct from the envelope shape: no `encrypted_*` fields and no
 * wrapped DEK. Every document is stamped `none:v1`, so a plaintext record can
 * never be mistaken for an encrypted one.
 */
export const PlaintextAllergyStorageSchema = AllergySchema.omit({
  id: true,
  patient: true,
}).extend({
  crypto_scheme: z.literal('none:v1'),
  resident_id: z.string(),
})

export type PlaintextAllergyStorage = z.infer<
  typeof PlaintextAllergyStorageSchema
>

/**
 * Either storage shape. The document itself declares its scheme; the read path
 * verifies it against the active mode and fails closed on mismatch.
 */
export const StoredAllergySchema = z.union([
  EncryptedAllergySchema,
  PlaintextAllergyStorageSchema,
])
export type StoredAllergy = z.infer<typeof StoredAllergySchema>

export function isPlaintextAllergy(
  doc: StoredAllergy,
): doc is PlaintextAllergyStorage {
  return doc.crypto_scheme === 'none:v1'
}

export function plaintextAllergyToDomain(
  doc: PlaintextAllergyStorage & { id: string },
): z.infer<typeof AllergySchema> {
  const { crypto_scheme, resident_id, ...rest } = doc
  return AllergySchema.parse({
    ...rest,
    id: doc.id,
    patient: toPatientReference(resident_id),
  })
}

export function allergyToPlaintextStorage(
  allergy: Omit<
    z.infer<typeof AllergySchema>,
    'id' | 'patient' | 'recorder_id'
  >,
  residentId: string,
  recorderId: string,
): PlaintextAllergyStorage {
  return PlaintextAllergyStorageSchema.parse({
    crypto_scheme: 'none:v1',
    resident_id: residentId,
    recorder_id: recorderId,
    ...allergy,
  })
}
