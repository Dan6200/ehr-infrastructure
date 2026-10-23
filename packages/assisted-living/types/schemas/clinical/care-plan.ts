import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { CarePlanStatusTypeEnum } from '#root/types/enums'

export const CarePlanSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  status: CarePlanStatusTypeEnum,
  goal_ids: z.array(z.string()).optional(),
  title: z.string(),
  author_id: z.string(),
  created_date: z.string(),
})
export type CarePlan = z.infer<typeof CarePlanSchema>
