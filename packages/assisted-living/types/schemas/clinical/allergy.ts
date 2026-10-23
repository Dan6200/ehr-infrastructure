import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import {
  AllergyClinicalStatusEnum,
  AllergyVerificationStatusEnum,
  AllergyTypeEnum,
} from '#root/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'

export const AllergySchema = z.object({
  id: z.string(),
  patient: ReferenceSchema,
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
export type Allergy = z.infer<typeof AllergySchema>
