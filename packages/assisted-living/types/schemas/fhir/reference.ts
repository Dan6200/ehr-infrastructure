import { z } from 'zod'

/**
 * FHIR `Reference` type — a link to another resource.
 * https://hl7.org/fhir/references.html
 *
 * We use this as the canonical way to reference a resident (Patient) from
 * subcollection domain objects. The storage layer keeps a plaintext
 * `resident_id` for querying; converters map between the two.
 */
export const ReferenceSchema = z.object({
  reference: z.string(), // e.g. "Patient/abc123"
  type: z.string().optional(), // e.g. "Patient"
  identifier: z
    .object({
      system: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
  display: z.string().optional(), // e.g. resident_name
})

export type Reference = z.infer<typeof ReferenceSchema>

/** Build a `Patient/…` reference for a resident id. */
export function toPatientReference(
  residentId: string,
  display?: string,
): Reference {
  return ReferenceSchema.parse({
    reference: `Patient/${residentId}`,
    type: 'Patient',
    ...(display ? { display } : {}),
  })
}

/** Extract the resource id from a `Reference.reference` (e.g. "Patient/abc" → "abc"). */
export function referenceId(ref: Reference): string {
  return ref.reference.split('/').pop() ?? ''
}
