import { z } from 'zod'
import { ConditionStatusEnum } from '#/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'

export const DiagnosticHistorySchema = z
  .object({
    id: z.string(),
    resident_id: z.string(),
    recorder_id: z.string(),
    clinical_status: ConditionStatusEnum,
    recorded_date: z.string(),
    onset_datetime: z.string(),
    abatement_datetime: z.string().nullable().optional(),
    title: z.string(),
    // code: CodeableConceptSchema, -- for now embed directly...
    CodeableConceptSchema,
  })
  .optional()
