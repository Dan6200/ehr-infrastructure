import { z } from 'zod'
import { AdministrationStatusEnum } from '#root/types/enums'
import { MedicationSchema, StrengthSchema } from '.'
import { CodeableConceptSchema } from '../codeable-concept'

export const EmarRecordSchema = z.object({
  id: z.string(),
  resident_id: z.string(),
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
