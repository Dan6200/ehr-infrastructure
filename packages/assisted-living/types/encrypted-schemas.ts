import { z } from 'zod'

// --- Encrypted Field Schema ---
export const EncryptedFieldSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  authTag: z.string(),
})

// --- Encrypted Schemas (for Firestore Storage) ---

export const EncryptedAllergySchema = z.object({
  resident_id: z.string(),
  recorder_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_name: EncryptedFieldSchema,
  encrypted_clinical_status: EncryptedFieldSchema,
  encrypted_verification_status: EncryptedFieldSchema,
  encrypted_type: EncryptedFieldSchema,
  encrypted_recorded_date: EncryptedFieldSchema,
  encrypted_substance: EncryptedFieldSchema,
  encrypted_reaction: EncryptedFieldSchema,
})

export const EncryptedPrescriptionSchema = z.object({
  resident_id: z.string(),
  recorder_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_period: EncryptedFieldSchema,
  encrypted_status: EncryptedFieldSchema,
  encrypted_adherence: EncryptedFieldSchema,
  encrypted_medication: EncryptedFieldSchema,
  encrypted_dosage_instruction: EncryptedFieldSchema,
})

export const EncryptedObservationSchema = z.object({
  resident_id: z.string(),
  recorder_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_status: EncryptedFieldSchema,
  encrypted_category: EncryptedFieldSchema,
  encrypted_code: EncryptedFieldSchema,
  encrypted_value_quantity: EncryptedFieldSchema,
  encrypted_effective_datetime: EncryptedFieldSchema,
  encrypted_body_site: EncryptedFieldSchema,
  encrypted_method: EncryptedFieldSchema,
  encrypted_device: EncryptedFieldSchema,
})

export const EncryptedDiagnosticHistorySchema = z.object({
  resident_id: z.string(),
  recorder_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_clinical_status: EncryptedFieldSchema,
  encrypted_recorded_date: EncryptedFieldSchema,
  encrypted_onset_datetime: EncryptedFieldSchema,
  encrypted_abatement_datetime: EncryptedFieldSchema.nullable(),
  encrypted_title: EncryptedFieldSchema,
  encrypted_coding: EncryptedFieldSchema,
})

export const EncryptedEmarRecordSchema = z.object({
  resident_id: z.string(),
  recorder_id: z.string(),
  prescription_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_medication: EncryptedFieldSchema,
  encrypted_status: EncryptedFieldSchema,
  encrypted_effective_datetime: EncryptedFieldSchema,
  encrypted_dosage: EncryptedFieldSchema,
})

export const EncryptedFinancialTransactionSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_amount: EncryptedFieldSchema,
  encrypted_occurrence_datetime: EncryptedFieldSchema,
  encrypted_type: EncryptedFieldSchema,
  encrypted_description: EncryptedFieldSchema,
})

export const EncryptedCarePlanSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_status: EncryptedFieldSchema,
  encrypted_title: EncryptedFieldSchema,
  encrypted_author_id: EncryptedFieldSchema,
  encrypted_created_date: EncryptedFieldSchema,
  encrypted_goals: EncryptedFieldSchema,
  encrypted_activites: EncryptedFieldSchema,
})

export const EncryptedEpisodesOfCareSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_status: EncryptedFieldSchema,
  encrypted_type: EncryptedFieldSchema,
  encrypted_period_start: EncryptedFieldSchema,
  encrypted_managing_organization: EncryptedFieldSchema,
})

export const EncryptedEmergencyContactSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_contact_name: EncryptedFieldSchema.nullable().optional(),
  encrypted_cell_phone: EncryptedFieldSchema,
  encrypted_work_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_home_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_relationship: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedResidentSchema = z.object({
  // Unencrypted fields
  facility_id: z.string(),

  // Encrypted DEKs
  encrypted_dek_general: z.string(),
  encrypted_dek_contact: z.string(),
  encrypted_dek_clinical: z.string(),
  encrypted_dek_financial: z.string(),

  // Encrypted data fields
  encrypted_avatar_url: EncryptedFieldSchema.nullable().optional(),
  encrypted_gender: EncryptedFieldSchema.nullable().optional(),
  encrypted_resident_name: EncryptedFieldSchema.nullable().optional(),
  encrypted_dob: EncryptedFieldSchema.nullable().optional(),
  encrypted_pcp: EncryptedFieldSchema.nullable().optional(),
  encrypted_room_no: EncryptedFieldSchema.nullable().optional(),
  encrypted_resident_email: EncryptedFieldSchema.nullable().optional(),
  encrypted_cell_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_work_phone: EncryptedFieldSchema.nullable().optional(),
  encrypted_home_phone: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedAccountSchema = z.object({
  encrypted_dek: z.string(),
  subject_id: z.string(),
  encrypted_billing_status: EncryptedFieldSchema,
  encrypted_balance: EncryptedFieldSchema,
  encrypted_created_at: EncryptedFieldSchema,
})

export const EncryptedChargeSchema = z.object({
  encrypted_dek: z.string(),
  account_id: z.string(),
  encrypted_service: EncryptedFieldSchema,
  encrypted_quantity: EncryptedFieldSchema,
  encrypted_unit_price: EncryptedFieldSchema,
  encrypted_occurrence_datetime: EncryptedFieldSchema,
})

export const EncryptedClaimSchema = z.object({
  encrypted_dek: z.string(),
  account_id: z.string(),
  coverage_id: z.string(),
  charge_ids: z.array(z.string()),
  encrypted_created: EncryptedFieldSchema,
  encrypted_status: EncryptedFieldSchema,
  encrypted_total: EncryptedFieldSchema,
})

export const EncryptedPaymentSchema = z.object({
  encrypted_dek: z.string(),
  account_id: z.string(),
  claim_id: z.string().optional(),
  encrypted_amount: EncryptedFieldSchema,
  encrypted_occurrence_datetime: EncryptedFieldSchema,
})

export const EncryptedAdjustmentSchema = z.object({
  encrypted_dek: z.string(),
  account_id: z.string(),
  claim_id: z.string(),
  encrypted_reason: EncryptedFieldSchema,
  encrypted_approved_amount: EncryptedFieldSchema,
  encrypted_created_at: EncryptedFieldSchema,
})
