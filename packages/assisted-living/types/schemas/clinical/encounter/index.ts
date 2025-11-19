import { z } from 'zod'
import { PeriodSchema } from '../period'
import {
  EncounterBusinessStatusAgedCare,
  EncounterDiagnosisUseCode,
  EncounterReasonUseCode,
  EncounterTypeSchema,
  SnomedConceptSchema,
} from '../../codeable-concept'
import { EncounterStatusEnum } from '#root/types/enums'

export const EncounterSchema = z.object({
  id: z.string(),
  subject_id: z.string(),
  type: EncounterTypeSchema,
  status: EncounterStatusEnum,
  business_status: EncounterBusinessStatusAgedCare.optional(),

  period: PeriodSchema.optional(),

  diagnosis: z.object({
    use: EncounterDiagnosisUseCode,
    value: SnomedConceptSchema,
  }),
  reason: z.object({
    use: EncounterReasonUseCode,
    value: SnomedConceptSchema,
  }),

  episodes_of_care_id: z.string(),

  location: z.string().optional(),
  participant_id: z.string().optional(),
  participant_name: z.string().optional(),

  service_provider_id: z.string().optional(),
  account_id: z.string().optional(),

  notes: z.string().optional(),
  recorded_at: z.string(),
})
