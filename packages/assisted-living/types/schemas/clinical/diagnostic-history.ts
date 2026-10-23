import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { ConditionStatusEnum } from '#root/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'

export const DiagnosticHistorySchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  recorder_id: z.string(),
  clinical_status: ConditionStatusEnum,
  recorded_date: z.string(),
  onset_datetime: z.string(),
  abatement_datetime: z.string().nullable().optional(),
  title: z.string(),
  code: CodeableConceptSchema,
})
export type DiagnosticHistory = z.infer<typeof DiagnosticHistorySchema>
