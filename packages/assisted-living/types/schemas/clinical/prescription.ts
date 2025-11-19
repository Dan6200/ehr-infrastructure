import { z } from 'zod'
import {
  PrescriptionStatusEnum,
  PrescriptionAdherenceStatusEnum,
} from '#/types/enums'
import { PeriodSchema, MedicationSchema, DosageInstructionSchema } from '.'

export const PrescriptionSchema = z
  .object({
    id: z.string(),
    resident_id: z.string(),
    recorder_id: z.string(),
    period: PeriodSchema,
    status: PrescriptionStatusEnum,
    adherence: PrescriptionAdherenceStatusEnum,
    medication: MedicationSchema,
    dosage_instruction: z.array(DosageInstructionSchema),
  })
  .optional()
