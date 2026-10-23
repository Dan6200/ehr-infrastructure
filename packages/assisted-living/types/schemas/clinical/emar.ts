import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { AdministrationStatusEnum } from '#root/types/enums'
import { MedicationSchema } from './medication'
import { StrengthSchema } from './strength'
import { CodeableConceptSchema } from '../codeable-concept'

export type EmarRecord = z.infer<typeof EmarRecordSchema>

export const EmarRecordSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  prescription_id: z.string(),
  medication: MedicationSchema,
  recorder_id: z.string(),
  status: AdministrationStatusEnum,
  effective_datetime: z.string(),
  dosage: z.object({
    route: CodeableConceptSchema,
    administered_dose: StrengthSchema,
    dose_number: z.number(),
  }),
})
