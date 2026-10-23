import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'

export const ChargeSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  service: z.string(),
  code: z.string().nullable().optional(),
  quantity: z.number().default(1),
  unit_price: z.object({
    value: z.number(),
    currency: z.string().default('NGN'),
  }),
  occurrence_datetime: z.string(),
  description: z.string().optional(),
})
export type Charge = z.infer<typeof ChargeSchema>
