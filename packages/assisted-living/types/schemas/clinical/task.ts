import { IntentEnum, PriorityEnum, TaskStatusEnum } from '@/types/enums'
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

  performer_id: z.string(),
  performer_name: z.string().optional(),

  notes: z.string().optional(),
  outcome: z.string().optional(), // "successful", "partial", etc.

  authored_on: z.string(),
  last_modified: z.string(),
  do_not_perform: z.boolean(),

  created_at: z.string(),
  updated_at: z.string(),
  viewed_at: z.string(),
})
