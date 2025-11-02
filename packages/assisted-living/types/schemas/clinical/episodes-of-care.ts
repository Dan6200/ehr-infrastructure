import { z } from 'zod'
import { EpisodeStatusTypeEnum } from '@/types/enums'
import { SnomedConceptSchema } from '../codeable-concept'
import { PeriodSchema } from '.'

export const EpisodesOfCareSchema = z.object({
  id: z.string(),
  resident_id: z.string(),
  status: EpisodeStatusTypeEnum,
  type: SnomedConceptSchema,
  period: PeriodSchema,
  diagnosis: z.object({
    use: EncounterDiagnosisUseConceptSchema,
    value: SnomedConceptSchema,
  }),
  reason: z.object({
    use: EncounterReasonUseCode,
    value: SnomedConceptSchema,
  }),
  managing_organization: z.string().optional(),
  care_manager_id: z.string().optional(),
  team_ids: z.array(z.string()).optional(),
  account_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})
