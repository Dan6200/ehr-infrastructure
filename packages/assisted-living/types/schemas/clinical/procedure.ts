import { z } from 'zod'
import { SnomedConceptSchema } from '../codeable-concept'
import { ProcedureStatusEnum } from '#root/types/enums'
import { PeriodSchema } from './period'
import { OccurrenceSchema } from './occurrence'

export const ProcedureSchema = z.object({
  id: z.string(),
  subject: z.object({
    id: z.string(), // resident_id
    name: z.string(),
  }),
  focus: z.string(),
  careplan_id: z.string().optional(),
  encounter_id: z.string().optional(),
  code: SnomedConceptSchema,

  status: ProcedureStatusEnum,
  occurrence: OccurrenceSchema,

  category: SnomedConceptSchema.optional(),
  body_site: SnomedConceptSchema.optional(),

  performer: z.object({
    id: z.string(),
    name: z.string().optional(),
    period: PeriodSchema,
  }),

  notes: z.string().optional(),
  outcome: z.string().optional(), // summary text like "No complications"
  recorded_at: z.string(),
  created_at: z.string(), // This is for firestore db metadata
  updated_at: z.string(), // This is for firestore db metadata
  viewed_at: z.string(), // This is for firestore db metadata
})
