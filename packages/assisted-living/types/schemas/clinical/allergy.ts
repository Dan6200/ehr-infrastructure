import { z } from 'zod'
import {
  AllergyClinicalStatusEnum,
  AllergyVerificationStatusEnum,
  AllergyTypeEnum,
} from '#/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'

export const AllergySchema = z
  .object({
    id: z.string(),
    resident_id: z.string(),
    recorder_id: z.string(),
    clinical_status: AllergyClinicalStatusEnum,
    verification_status: AllergyVerificationStatusEnum,
    type: AllergyTypeEnum,
    name: CodeableConceptSchema,
    recorded_date: z.string(),
    substance: CodeableConceptSchema,
    reaction: z.object({
      code: CodeableConceptSchema,
      severity: z.string(),
    }),
  })
  .optional()
