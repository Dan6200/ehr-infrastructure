import { z } from 'zod'

export const RangeSchema = z.object({
  low: z.string(),
  high: z.string(),
})
