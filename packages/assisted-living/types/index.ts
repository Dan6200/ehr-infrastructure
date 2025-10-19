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

export const FinancialTransactionTypeEnum = z.enum(['PAYMENT', 'CHARGE'])

export const MedicalRecordTypeEnum = z.enum([
  'NURSING_NOTE',
  'PHYSICIAN_ORDER',
  'INCIDENT_REPORT',
  'CONSULTATION',
  'OTHER',
])

// --- Plaintext Schemas (for Application Use) ---
export const VitalSchema = z.object({
  date: z.string(), // ISO 8601 date string
  loinc_code: z.string(),
  value: z.string(),
  unit: z.string().optional(),
})

export const MedicalRecordSchema = z.object({
  date: z.string(), // ISO 8601 date string
  title: z.string(),
  notes: z.string(),
  snomed_code: z.string(), // SNOMED code for the record type
})

export const AllergySchema = z.object({
  name: z.string(),
  snomed_code: z.string().optional(),
  reaction: z.string().optional(),
})

export const MedicationSchema = z.object({
  name: z.string(),
  rxnorm_code: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
})

export const FinancialTransactionSchema = z.object({
  amount: z.number(),
  date: z.string(), // ISO 8601 date string
  type: FinancialTransactionTypeEnum,
  description: z.string(),
})

export const EmergencyContactSchema = z
  .object({
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
  allergies: z.array(AllergySchema).nullable().optional(),
  medications: z.array(MedicationSchema).nullable().optional(),
  financials: z.array(FinancialTransactionSchema).nullable().optional(),
  medical_records: z.array(MedicalRecordSchema).nullable().optional(),
  vitals: z.array(VitalSchema).nullable().optional(),
})

// --- Encrypted Field Schema ---
export const EncryptedFieldSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  authTag: z.string(),
})

// --- Encrypted Schemas (for Firestore Storage) ---
export const EncryptedVitalSchema = z.object({
  encrypted_date: EncryptedFieldSchema,
  encrypted_loinc_code: EncryptedFieldSchema,
  encrypted_value: EncryptedFieldSchema,
  encrypted_unit: EncryptedFieldSchema.optional(),
})

export const EncryptedMedicalRecordSchema = z.object({
  encrypted_date: EncryptedFieldSchema,
  encrypted_title: EncryptedFieldSchema,
  encrypted_notes: EncryptedFieldSchema,
  encrypted_snomed_code: EncryptedFieldSchema,
})

export const EncryptedAllergySchema = z.object({
  encrypted_name: EncryptedFieldSchema,
  encrypted_snomed_code: EncryptedFieldSchema.optional(),
  encrypted_reaction: EncryptedFieldSchema.optional(),
})

export const EncryptedMedicationSchema = z.object({
  encrypted_name: EncryptedFieldSchema,
  encrypted_rxnorm_code: EncryptedFieldSchema.optional(),
  encrypted_dosage: EncryptedFieldSchema.optional(),
  encrypted_frequency: EncryptedFieldSchema.optional(),
})

export const EncryptedFinancialTransactionSchema = z.object({
  encrypted_amount: EncryptedFieldSchema,
  encrypted_date: EncryptedFieldSchema,
  encrypted_type: EncryptedFieldSchema,
  encrypted_description: EncryptedFieldSchema,
})

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
  encrypted_dek_general: z.string(),
  encrypted_dek_contact: z.string(),
  encrypted_dek_clinical: z.string(),
  encrypted_dek_financial: z.string(), // New DEK for financial data

  // Encrypted data fields
  encrypted_avatar_url: EncryptedFieldSchema.nullable().optional(),
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
  encrypted_allergies: z.array(EncryptedAllergySchema).nullable().optional(),
  encrypted_medications: z
    .array(EncryptedMedicationSchema)
    .nullable()
    .optional(),
  encrypted_financials: z
    .array(EncryptedFinancialTransactionSchema)
    .nullable()
    .optional(),
  encrypted_medical_records: z
    .array(EncryptedMedicalRecordSchema)
    .nullable()
    .optional(),
  encrypted_vitals: z.array(EncryptedVitalSchema).nullable().optional(),
})

// --- Types ---
export type Vital = z.infer<typeof VitalSchema>
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>
export type Allergy = z.infer<typeof AllergySchema>
export type Medication = z.infer<typeof MedicationSchema>
export type FinancialTransaction = z.infer<typeof FinancialTransactionSchema>
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type Resident = z.infer<typeof ResidentSchema>
export type EncryptedResident = z.infer<typeof EncryptedResidentSchema>

// --- Other Schemas & Types (unchanged) ---
export const FacilitySchema = z.object({
  id: z.string().optional(),
  address: z.string(),
})
export type Facility = z.infer<typeof FacilitySchema>

export const ResidentDataSchema = ResidentSchema.extend({
  id: z.string().optional(),
  address: z.string(),
})
export type ResidentData = z.infer<typeof ResidentDataSchema>
