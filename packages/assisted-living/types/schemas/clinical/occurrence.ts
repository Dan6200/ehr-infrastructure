import { z } from 'zod'
import { PeriodSchema } from './period'
import { TimingSchema } from './timing'
import { UCUMConceptSchema } from '../codeable-concept'
import { RangeSchema } from './range'

export const OccurrenceSchema = z.object({
  datetime: z.string(),
  period: PeriodSchema.optional(),
  age: UCUMConceptSchema.optional(),
  range: RangeSchema.optional(),
  timing: TimingSchema.optional(),
})
