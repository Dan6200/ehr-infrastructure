import { z } from 'zod'
import { SnomedConceptSchema } from '../codeable-concept'
import { ProcedureStatusEnum } from '@/types/enums'
import { PeriodSchema } from './period'
import { OccurrenceSchema } from './occurrence'

export const ProcedureSchema = z.object({
  id: z.string(),
  subject_id: z.string(),
  focus: z.string(),
  careplan_id: z.string().optional(),
  encounter_id: z.string().optional(),
  code: SnomedConceptSchema,

  status: ProcedureStatusEnum,
  occurrence: OccurrenceSchema,

  category: SnomedConceptSchema,
  body_site: SnomedConceptSchema,

  performer: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    period: PeriodSchema,
  }),

  notes: z.string().optional(),
  outcome: z.string().optional(), // summary text like "No complications"
  recorded_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  viewed_at: z.string(),
})
