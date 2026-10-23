import { z } from 'zod'
import {
  CarePlanActivityKindEnum,
  CarePlanActivityStatusEnum,
} from '#root/types/enums'
import { CodeableConceptSchema } from '../codeable-concept'
import { ReferenceSchema } from '../fhir/reference'
import { TimingSchema } from './timing'

/**
 * FHIR `CarePlan.activity.detail`.
 * https://hl7.org/fhir/careplan.html#CarePlan.activity
 */
export const CarePlanActivityDetailSchema = z.object({
  kind: CarePlanActivityKindEnum.default('ServiceRequest'), // detail.kind
  code: CodeableConceptSchema, // detail.code
  status: CarePlanActivityStatusEnum, // detail.status
  status_reason: CodeableConceptSchema.optional(), // detail.statusReason
  do_not_perform: z.boolean().default(false), // detail.doNotPerform
  scheduled_timing: TimingSchema.optional(), // detail.scheduled[x] (scheduledTiming)
  performer: z.array(ReferenceSchema).default([]), // detail.performer[]
  description: z.string().optional(), // detail.description
})

/**
 * FHIR `CarePlan.activity` (a BackboneElement nested inside the CarePlan).
 * `id` is the element id used by the UI; the resident and care-plan links are
 * implied by the parent resource.
 */
export const CarePlanActivitySchema = z.object({
  id: z.string().optional(), // BackboneElement.id
  detail: CarePlanActivityDetailSchema,
})

export type CarePlanActivity = z.infer<typeof CarePlanActivitySchema>
export type CarePlanActivityDetail = z.infer<
  typeof CarePlanActivityDetailSchema
>
