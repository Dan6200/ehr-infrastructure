import { z } from 'zod'
import { toPatientReference } from '#root/types/schemas/fhir/reference'

/**
 * Builds the per-collection storage codec for the two crypto modes.
 *
 * - `storedSchema` accepts either the envelope shape or the plaintext shape.
 * - `plaintextToDomain` maps a plaintext document (which carries `resident_id`)
 *   back to the domain object (which carries the FHIR `Reference`).
 * - `domainToPlaintext` maps a domain object to the plaintext storage shape.
 */
export function makeCodec<
  E extends z.ZodTypeAny,
  D extends z.ZodObject<z.ZodRawShape>,
>({
  domainSchema,
  encryptedSchema,
  linkField,
}: {
  domainSchema: D
  encryptedSchema: E
  linkField: string
}) {
  const plaintextSchema = (domainSchema as z.ZodObject<z.ZodRawShape>)
    .omit({ id: true, [linkField]: true } as never)
    .extend({
      crypto_scheme: z.literal('none:v1'),
      resident_id: z.string(),
    })

  const storedSchema = z.union([encryptedSchema, plaintextSchema])

  const plaintextToDomain = (doc: any): z.infer<D> => {
    const { crypto_scheme, resident_id, ...rest } = doc
    return domainSchema.parse({
      ...rest,
      [linkField]: toPatientReference(resident_id),
    })
  }

  const domainToPlaintext = (
    domain: any,
    residentId: string,
    recorderId?: string,
  ) => {
    const { id, ...rest } = domain
    delete rest[linkField]
    return plaintextSchema.parse({
      crypto_scheme: 'none:v1',
      resident_id: residentId,
      ...(recorderId ? { recorder_id: recorderId } : {}),
      ...rest,
    })
  }

  return { plaintextSchema, storedSchema, plaintextToDomain, domainToPlaintext }
}
