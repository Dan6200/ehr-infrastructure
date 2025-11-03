import { z } from 'zod'

export const ChargeSchema = z.object({
  id: z.string(),
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
