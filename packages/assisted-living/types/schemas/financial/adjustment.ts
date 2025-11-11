import { z } from 'zod'

export const AdjustmentSchema = z.object({
  id: z.string(),
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
