import { z } from 'zod'
import { CoverageStatusEnum } from '@/types/enums'
import { PeriodSchema } from '../clinical'

export const CoverageSchema = z.object({
  id: z.string(),
  status: CoverageStatusEnum,
  type: z.string().optional(), // e.g. "NHIS", "Private Insurance", "Self-pay"
  beneficiary_id: z.string(), // resident_id
  // The organization or individual responsible for paying
  payor: z.object({
    id: z.string(),
    organization: z.string().nullable(), // Null if id is resident_id
  }),
  // Coverage period
  period: PeriodSchema,

  // Optional policy identifiers
  policy_number: z.string().nullable().optional(),
  plan_name: z.string().nullable().optional(),

  // Relationships or classifications (e.g. dependent, spouse, worker)
  relationship: z.string().optional(), // "self" | "dependent" | "child" | etc.

  // Coverage level (optional)
  class: z
    .array(
      z.object({
        type: z.string().optional(), // e.g. "plan" | "group"
        value: z.string(),
        name: z.string().optional(),
      }),
    )
    .optional(),

  // Financial details (optional)
  network: z.string().optional(),
  cost_to_beneficiary: z.number().nullable().optional(),

  // Metadata
  authored_on: z.string(),
  updated_at: z.string().optional(),
})
