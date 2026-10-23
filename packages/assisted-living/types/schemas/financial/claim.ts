import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { ClaimStatusEnum } from '#root/types/enums'

export const ClaimSchema = z.object({
  id: z.string(),
  authored_on: z.string(),
  patient: ReferenceSchema,
  status: ClaimStatusEnum,
  coverage_id: z.string().nullable().optional(),
  charge_ids: z.array(z.string()).default([]),
  total: z.object({ value: z.number(), currency: z.string().default('NGN') }),
  description: z.string().optional(),
})
export type Claim = z.infer<typeof ClaimSchema>
