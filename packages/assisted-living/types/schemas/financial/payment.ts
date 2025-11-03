import { z } from 'zod'

export const PaymentSchema = z.object({
  id: z.string(),
  claim_id: z.string().nullable().optional(),
  coverage_id: z.string().nullable().optional(),
  amount: z.object({ value: z.number(), currency: z.string().default('NGN') }),
  payor: z.string(), // could reference org or program
  occurrence_datetime: z.string(),
  method: z.string().optional(), // e.g. "EFT", "cash", "check"
})
