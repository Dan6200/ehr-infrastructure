import { IntentEnum, PriorityEnum, TaskStatusEnum } from '#root/types/enums'
import { z } from 'zod'
import { PeriodSchema } from './period'

export const TaskSchema = z.object({
  id: z.string(), // UUID
  resident_id: z.string(),
  careplan_id: z.string().optional(),

  activity_code: z.string().optional(), // SNOMED, internal, etc.

  status: TaskStatusEnum,

  intent: IntentEnum,
  priority: PriorityEnum,

  requested_period: PeriodSchema,

  execution_period: PeriodSchema,

  performer: z.object({
    id: z.string(),
    name: z.string().optional(),
    period: PeriodSchema,
  }),

  notes: z.string().optional(),
  outcome: z.string().optional(), // "successful", "partial", etc.

  authored_on: z.string(),
  last_modified: z.string(),
  do_not_perform: z.boolean(),

  created_at: z.string(),
  updated_at: z.string(),
  viewed_at: z.string(),
})
