import { z } from 'zod'
import { ClaimStatusEnum } from '@/types/enums'

export const ClaimSchema = z.object({
  id: z.string(),
  authored_on: z.string(),
  status: ClaimStatusEnum,
  coverage_id: z.string().nullable().optional(),
  charge_ids: z.array(z.string()).default([]),
  total: z.object({ value: z.number(), currency: z.string().default('NGN') }),
  description: z.string().optional(),
})
