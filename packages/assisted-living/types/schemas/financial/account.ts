import { z } from 'zod'
import { AccountBillingStatusConceptSchema } from '../codeable-concept'
import { PeriodSchema } from '../clinical'

export const AccountSchema = z.object({
  id: z.string(),
  billing_status: AccountBillingStatusConceptSchema,
  // The party responsible for this account (usually the resident)
  subject: z.object({
    id: z.string(), // resident_id
    name: z.string(),
  }),
  // The party who can be contacted for billing purposes
  guarantor: z
    .object({
      party: z.object({
        id: z.string(), // resident_id or emergency_contact_id
        name: z.string(),
      }),
      on_hold: z.boolean().default(false),
      period: PeriodSchema.optional(),
    })
    .array()
    .optional(),

  // The service period for which this account is active
  service_period: PeriodSchema.optional(),

  // The current balance of the account
  balance: z.object({
    value: z.number().default(0),
    currency: z.string().default('NGN'),
  }),

  // Metadata
  authored_on: z.string(),
  updated_at: z.string().optional(),
})
