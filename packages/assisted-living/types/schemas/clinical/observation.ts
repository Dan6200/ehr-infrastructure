import { z } from 'zod'
import { ObservationStatusEnum } from '#root/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'
import { ValueQuantitySchema } from '.'

export const ObservationSchema = z
  .object({
    id: z.string(),
    resident_id: z.string(),
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
  .optional()
