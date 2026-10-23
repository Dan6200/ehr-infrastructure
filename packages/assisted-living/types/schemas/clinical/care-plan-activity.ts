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
 *
 * In FHIR, `activity` is a nested BackboneElement of `CarePlan`. Here it is
 * stored as a subcollection, so `careplan_id` is the explicit parent link and
 * `resident_id` is the denormalized storage/query linkage (see
 * `notes/resident_linkage_standardization.md`).
 */
export const CarePlanActivitySchema = z.object({
  id: z.string(),
  resident_id: z.string(),
  careplan_id: z.string(),
  kind: CarePlanActivityKindEnum.default('ServiceRequest'), // detail.kind
  code: CodeableConceptSchema, // detail.code
  status: CarePlanActivityStatusEnum, // detail.status
  status_reason: CodeableConceptSchema.optional(), // detail.statusReason
  do_not_perform: z.boolean().default(false), // detail.doNotPerform
  scheduled_timing: TimingSchema.optional(), // detail.scheduled[x] (scheduledTiming)
  performer: z.array(ReferenceSchema).default([]), // detail.performer[]
  description: z.string().optional(), // detail.description
})
export type CarePlanActivity = z.infer<typeof CarePlanActivitySchema>
