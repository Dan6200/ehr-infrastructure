import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'

export const AdjustmentSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  claim_id: z.string(),
  reason: z.string(),
  approved_amount: z.object({
    value: z.number(),
    currency: z.string().default('NGN'),
  }),
  coverage_id: z.string().nullable().optional(),
  authored_on: z.string(),
  updated_at: z.string().optional(),
})
export type Adjustment = z.infer<typeof AdjustmentSchema>
