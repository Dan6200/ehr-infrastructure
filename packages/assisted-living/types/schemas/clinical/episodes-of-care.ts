import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { EpisodeStatusTypeEnum } from '#root/types/enums'
import {
  EncounterDiagnosisUseCode,
  EncounterReasonUseCode,
  EpisodesOfCareTypeCode,
  SnomedConceptSchema,
} from '../codeable-concept'
import { PeriodSchema } from './period'

export const EpisodesOfCareSchema = z.object({
  id: z.string(),
  patient: ReferenceSchema,
  status: EpisodeStatusTypeEnum,
  type: EpisodesOfCareTypeCode,
  period: PeriodSchema,
  diagnosis: z.object({
    use: EncounterDiagnosisUseCode,
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
export type EpisodeOfCare = z.infer<typeof EpisodesOfCareSchema>
