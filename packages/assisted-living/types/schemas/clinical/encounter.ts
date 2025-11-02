import { z } from 'zod'
import { PeriodSchema } from './period'
import { CodeableConceptSchema } from '../codeable-concept'
import { EncounterStatusEnum } from '@/types/enums'

export const EncounterSchema = z.object({
  id: z.string(),
  resident_id: z.string(),
  type: z.string().optional(),
  status: EncounterStatusEnum,

  period: PeriodSchema.optional(),

  reason: CodeableConceptSchema.optional(),

  location: z.string().optional(),
  participant_id: z.string().optional(),
  participant_name: z.string().optional(),

  provider_id: z.string().optional(),

  notes: z.string().optional(),
  recorded_at: z.string(),
})
