import { z } from 'zod'
import {
  RelationshipEnum,
  LegalRelationshipEnum,
  PersonalRelationshipEnum,
} from '#/types/enums'

export const EmergencyContactSchema = z
  .object({
    id: z.string(),
    resident_id: z.string(),
    contact_name: z.string().nullable().optional(),
    cell_phone: z.string(),
    work_phone: z.string().nullable().optional(),
    home_phone: z.string().nullable().optional(),
    relationship: z.array(RelationshipEnum).nullable().optional(),
    legal_relationships: z.array(LegalRelationshipEnum).nullable().optional(),
    personal_relationships: z
      .array(PersonalRelationshipEnum)
      .nullable()
      .optional(),
  })
  .transform((data) => ({
    ...data,
    relationship: [
      ...(data.relationship || []),
      ...(data.legal_relationships || []),
      ...(data.personal_relationships || []),
    ],
  }))
