import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { ObservationStatusEnum } from '#root/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'
import { ValueQuantitySchema } from './value-quantity'

export const ObservationSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  recorder_id: z.string(),
  status: ObservationStatusEnum,
  category: z.array(CodeableConceptSchema),
  code: CodeableConceptSchema,
  effective_datetime: z.string(),
  value_quantity: ValueQuantitySchema,
  body_site: CodeableConceptSchema,
  method: CodeableConceptSchema,
  device: CodeableConceptSchema,
})
export type Observation = z.infer<typeof ObservationSchema>
