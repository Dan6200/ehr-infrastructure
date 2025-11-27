import { z } from 'zod'
import { GoalStatusEnum } from '#root/types/enums'
import { GoalConceptSchema } from '../codeable-concept'

export const GoalSchema = z.object({
  id: z.string(),
  lifecycle_status: GoalStatusEnum,
  category: z.string(), // TODO: create fhir category type
  priority: z.string(),
  description: z.object({
    code: GoalConceptSchema,
  }),
})
