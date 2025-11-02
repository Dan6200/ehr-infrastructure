import { z } from 'zod'

export const ObservationStatusEnum = z.enum([
  'registered',
  'preliminary',
  'final',
  'amended',
  'corrected',
  'cancelled',
  'entered-in-error',
  'unknown',
])

export const AllergyClinicalStatusEnum = z.enum([
  'active',
  'inactive',
  'resolved',
])

export const AllergyVerificationStatusEnum = z.enum([
  'unconfirmed',
  'presumed',
  'confirmed',
  'refuted',
  'entered-in-error',
])

export const AllergyTypeEnum = z.enum(['allergy', 'intolerance'])
export const ConditionStatusEnum = z.enum([
  'active',
  'recurrence',
  'remission',
  'resolved',
])

export const CarePlanGoalStatusEnum = z.enum([
  'proposed',
  'planned',
  'accepted',
  'active',
  'on-hold',
  'completed',
  'cancelled',
  'entered-in-error',
  'rejected',
])

export const CarePlanActivityStatusEnum = z.enum([
  'not-started',
  'scheduled',
  'in-progress',
  'on-hold',
  'completed',
  'cancelled',
  'stopped',
  'unknown',
  'entered-in-error',
])

export const PrescriptionStatusEnum = z.enum([
  'recorded',
  'entered-in-error',
  'draft',
])

export const PrescriptionAdherenceStatusEnum = z.enum([
  'taking',
  'taking-as-directed',
  'taking-not-as-directed',
  'not-taking',
  'on-hold',
  'on-hold-as-directed',
  'on-hold-not-as-directed',
  'stopped',
  'stopped-as-directed',
  'stopped-not-as-directed',
  'unknown',
])

export const EncounterStatusEnum = z.enum([
  'planned',
  'arrived',
  'in-progress',
  'onleave',
  'finished',
  'cancelled',
])

export const IntentEnum = z.enum([
  'unknown',
  'proposal',
  'plan',
  'order',
  'original-order',
  'reflex-order',
  'filler-order',
  'instance-order',
  'option',
])

export const PriorityEnum = z.enum(['routine', 'urgent', 'asap', 'stat'])

export const TaskStatusEnum = z.enum([
  'draft',
  'requested',
  'accepted',
  'in-progress',
  'completed',
  'cancelled',
  'failed',
])

export const ProcedureStatusEnum = z.enum([
  'preparation',
  'in-progress',
  'completed',
  'stopped',
  'entered-in-error',
])

export const AdministrationStatusEnum = z.enum([
  'in-progress',
  'not-done',
  'on-hold',
  'completed',
  'entered-in-error',
  'stopped',
  'unknown',
])

export const ClaimStatusEnum = z.enum([
  'draft',
  'submitted',
  'adjudicated',
  'paid',
])

export const LegalRelationshipEnum = z.enum([
  'HCP_AGENT_DURABLE',
  'POA_FINANCIAL',
  'GUARDIAN_OF_PERSON',
  'GUARDIAN_OF_ESTATE',
  'TRUSTEE',
])

export const CoverageStatusEnum = z.enum([
  'active',
  'cancelled',
  'draft',
  'entered-in-error',
])

export const PersonalRelationshipEnum = z.enum([
  'SPOUSE',
  'DOMESTIC_PARTNER',
  'PARENT',
  'CHILD',
  'SIBLING',
  'EMERGENCY_CONTACT',
  'CARETAKER',
  'FRIEND',
  'OTHER_RELATIVE',
])

export const RelationshipEnum = z.union([
  LegalRelationshipEnum,
  PersonalRelationshipEnum,
])

export const EpisodeStatusTypeEnum = z.enum([
  'active',
  'finished',
  'cancelled',
  'waitlist',
])

export const CarePlanStatusTypeEnum = z.enum([
  'draft',
  'active',
  'on-hold',
  'completed',
  'revoked',
  'entered-in-error',
  'ended',
  'unknown',
])

export const AccountBillingStatusEnum = z.enum([
  'open',
  'carecomplete-notbilled',
  'billing',
  'closed-baddebt',
  'closed-voided',
  'closed-completed',
  'closed-combined',
])
