import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import {
  PrescriptionStatusEnum,
  PrescriptionAdherenceStatusEnum,
} from '#root/types/enums'
import { PeriodSchema } from './period'
import { MedicationSchema } from './medication'
import { DosageInstructionSchema } from './dosage'

export const PrescriptionSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  recorder_id: z.string(),
  period: PeriodSchema,
  status: PrescriptionStatusEnum,
  adherence: PrescriptionAdherenceStatusEnum,
  medication: MedicationSchema,
  dosage_instruction: z.array(DosageInstructionSchema),
})
export type Prescription = z.infer<typeof PrescriptionSchema>
