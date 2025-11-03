import { z } from 'zod'
import { CarePlanStatusTypeEnum } from '@/types/enums'

export const CarePlanSchema = z.object({
  id: z.string(),
  resident_id: z.string(),
  status: CarePlanStatusTypeEnum,
  goal_ids: z.array(z.string()).optional(),
  title: z.string(),
  author_id: z.string(),
  created_date: z.string(),
})
