import { z } from 'zod'

export const AddressSchema = z.object({
  use: z.enum(['home', 'work', 'temp', 'old', 'billing']).optional(),
  type: z.enum(['postal', 'physical', 'both']).optional(),
  text: z.string().optional(), // For display
  line: z.array(z.string()), // Street name, number, apartment
  city: z.string(),
  district: z.string().optional(), // County, district, etc.
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
})
