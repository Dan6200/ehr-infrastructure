import { z } from 'zod'
import { ReferenceSchema } from '../fhir/reference'
import { CarePlanStatusTypeEnum } from '#root/types/enums'
import { CarePlanActivitySchema } from './care-plan-activity'

export const CarePlanSchema = z.object({
  id: z.string(),
  subject: ReferenceSchema,
  status: CarePlanStatusTypeEnum,
  goal_ids: z.array(z.string()).optional(),
  title: z.string(),
  author_id: z.string(),
  created_date: z.string(),
  // FHIR CarePlan.activity[] (BackboneElement), nested in the resource.
  activity: z.array(CarePlanActivitySchema).default([]),
})
export type CarePlan = z.infer<typeof CarePlanSchema>
