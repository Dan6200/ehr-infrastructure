import { z } from 'zod'

import { AddressSchema } from './address'

export const ResidentSchema = z.object({
  resident_code: z.string().optional(),
  resident_name: z.string().nullable().optional(),
  gender: z.string().optional(),
  address: AddressSchema.optional(),
  facility_id: z.string(),
  room_no: z.string(),
  avatar_url: z.string(),
  dob: z.string(),
  pcp: z.string(),
  resident_email: z.string().nullable().optional(),
  cell_phone: z.string().nullable().optional(),
  work_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
})
