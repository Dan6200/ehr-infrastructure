export type Nullable<T> = T | null | undefined

import { z } from 'zod'

// --- Enums ---
export const LegalRelationshipEnum = z.enum([
  'HCP_AGENT_DURABLE',
  'POA_FINANCIAL',
  'GUARDIAN_OF_PERSON',
  'GUARDIAN_OF_ESTATE',
  'TRUSTEE',
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

// --- Plaintext Schemas (for Application Use) ---
export const EmergencyContactSchema = z
  .object({
    contact_name: z.string().nullable().optional(),
    cell_phone: z.string(),
    work_phone: z.string().nullable().optional(),
    home_phone: z.string().nullable().optional(),
    legal_relationships: z.array(LegalRelationshipEnum).nullable().optional(),
    personal_relationships: z
      .array(PersonalRelationshipEnum)
      .nullable()
      .optional(),
  })
  .transform((data) => ({
    ...data,
    relationship: [
      ...(data.legal_relationships || []),
      ...(data.personal_relationships || []),
    ],
  }))

export const ResidentSchema = z.object({
  resident_name: z.string().nullable().optional(),
  facility_id: z.string(),
  room_no: z.string(),
  avatar_url: z.string(),
  dob: z.string(),
  pcp: z.string(),
  resident_email: z.string().nullable().optional(),
  cell_phone: z.string().nullable().optional(),
  work_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
  emergency_contacts: z.array(EmergencyContactSchema).nullable().optional(),
})

// --- Encrypted Field Schema ---
export const EncryptedFieldSchema = z.object({
  ciphertext: z.string(), // Base64 encoded Buffer
  iv: z.string(), // Base64 encoded Buffer
  authTag: z.string(), // Base64 encoded Buffer
})

// --- Encrypted Schemas (for Firestore Storage) ---
export const EncryptedEmergencyContactSchema = z.object({
  encrypted_contact_name: EncryptedFieldSchema.nullable().optional(),
  encrypted_cell_phone: EncryptedFieldSchema,
  encrypted_work_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_home_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_relationship: z.array(EncryptedFieldSchema).nullable().optional(),
})

export const EncryptedResidentSchema = z.object({
  // Unencrypted fields
  facility_id: z.string(),
  room_no: z.string(),

  // Encrypted DEKs
  encrypted_dek_general: z.string(), // Base64 encoded Buffer
  encrypted_dek_contact: z.string(), // Base64 encoded Buffer
  encrypted_dek_clinical: z.string(), // Base64 encoded Buffer

  // Encrypted data fields
  encrypted_avatar_url: EncryptedFieldSchema.nullable().optional(), // <--- Encrypted
  encrypted_resident_name: EncryptedFieldSchema.nullable().optional(),
  encrypted_dob: EncryptedFieldSchema.nullable().optional(),
  encrypted_pcp: EncryptedFieldSchema.nullable().optional(),
  encrypted_resident_email: EncryptedFieldSchema.nullable().optional(),
  encrypted_cell_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_work_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_home_phone: EncryptedFieldSchema.nullable().optional(),
  emergency_contacts: z
    .array(EncryptedEmergencyContactSchema)
    .nullable()
    .optional(),
})

// --- Types ---
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type Resident = z.infer<typeof ResidentSchema>
export type EncryptedResident = z.infer<typeof EncryptedResidentSchema>

// --- Other Schemas & Types (unchanged) ---
export const FacilitySchema = z.object({
  address: z.string(),
})
export type Facility = z.infer<typeof FacilitySchema>

export const ResidentDataSchema = z.object({
  resident_name: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  address: z.string(),
  facility_id: z.string(),
  room_no: z.string(),
  avatar_url: z.string(),
  dob: z.string(),
  pcp: z.string(),
  resident_email: z.string().nullable().optional(),
  cell_phone: z.string().nullable().optional(),
  work_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
  emergency_contacts: z.array(EmergencyContactSchema).nullable().optional(),
})
export type ResidentData = z.infer<typeof ResidentDataSchema>
