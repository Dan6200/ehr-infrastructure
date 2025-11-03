import { z } from 'zod'
import { GoalStatusEnum } from '@/types/enums'
import { GoalConceptSchema } from '../codeable-concept'

export const GoalSchema = z.object({
  lifecycle_status: GoalStatusEnum,
  category: z.string(), // TODO: create fhir category type
  priority: z.string(),
  description: z.object({
    code: GoalConceptSchema,
  }),
})
