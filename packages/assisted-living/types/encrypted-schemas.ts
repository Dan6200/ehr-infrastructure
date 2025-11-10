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

// Removed EncryptedFinancialTransactionSchema as it's replaced by specific financial schemas

export const EncryptedCarePlanSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  goal_ids: z.array(z.string()).optional(), // Plaintext array of goal IDs
  encrypted_status: EncryptedFieldSchema,
  encrypted_title: EncryptedFieldSchema,
  encrypted_author_id: EncryptedFieldSchema,
  encrypted_created_date: EncryptedFieldSchema,
  encrypted_activities: EncryptedFieldSchema, // Activities are now nested and encrypted
})

export const EncryptedGoalSchema = z.object({
  resident_id: z.string(), // Goals are now top-level, but still linked to a resident
  encrypted_dek: z.string(),
  encrypted_lifecycle_status: EncryptedFieldSchema,
  encrypted_category: EncryptedFieldSchema,
  encrypted_priority: EncryptedFieldSchema,
  encrypted_description: EncryptedFieldSchema,
})

export const EncryptedEpisodesOfCareSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_status: EncryptedFieldSchema,
  encrypted_type: EncryptedFieldSchema,
  encrypted_period: EncryptedFieldSchema,
  encrypted_diagnosis: EncryptedFieldSchema,
  encrypted_reason: EncryptedFieldSchema,
  encrypted_managing_organization: EncryptedFieldSchema,
  care_manager_id: z.string().optional(),
  team_ids: z.array(z.string()).optional(),
  account_id: z.string().optional(),
  encrypted_created_at: z.string().optional(),
  encrypted_updated_at: z.string().optional(),
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
  subject: z.object({
    id: z.string(), // Plaintext for querying
    encrypted_name: EncryptedFieldSchema,
  }),
  encrypted_billing_status: EncryptedFieldSchema,
  encrypted_balance: EncryptedFieldSchema,
  encrypted_created_at: EncryptedFieldSchema,
  encrypted_guarantor: EncryptedFieldSchema.optional(),
  encrypted_service_period: EncryptedFieldSchema.optional(),
  encrypted_updated_at: EncryptedFieldSchema.optional(),
})

export const EncryptedChargeSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_service: EncryptedFieldSchema,
  encrypted_code: EncryptedFieldSchema.nullable().optional(),
  encrypted_quantity: EncryptedFieldSchema,
  encrypted_unit_price: EncryptedFieldSchema,
  encrypted_occurrence_datetime: EncryptedFieldSchema,
  encrypted_description: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedClaimSchema = z.object({
  resident_id: z.string(),
  coverage_id: z.string().nullable().optional(),
  charge_ids: z.array(z.string()).default([]),
  encrypted_dek: z.string(),
  encrypted_created: EncryptedFieldSchema,
  encrypted_status: EncryptedFieldSchema,
  encrypted_total: EncryptedFieldSchema,
  encrypted_description: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedPaymentSchema = z.object({
  resident_id: z.string(),
  claim_id: z.string().nullable().optional(),
  coverage_id: z.string().nullable().optional(),
  encrypted_dek: z.string(),
  encrypted_amount: EncryptedFieldSchema,
  encrypted_payor: EncryptedFieldSchema,
  encrypted_occurrence_datetime: EncryptedFieldSchema,
  encrypted_method: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedAdjustmentSchema = z.object({
  resident_id: z.string(),
  claim_id: z.string(),
  coverage_id: z.string().nullable().optional(),
  encrypted_dek: z.string(),
  encrypted_reason: EncryptedFieldSchema,
  encrypted_approved_amount: EncryptedFieldSchema,
  encrypted_created_at: EncryptedFieldSchema,
  encrypted_updated_at: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedIdentifierSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_system: EncryptedFieldSchema,
  encrypted_value: EncryptedFieldSchema,
  encrypted_type: EncryptedFieldSchema.nullable().optional(),
  encrypted_issued: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedAddressSchema = z.object({
  resident_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_use: EncryptedFieldSchema.nullable().optional(),
  encrypted_type: EncryptedFieldSchema.nullable().optional(),
  encrypted_text: EncryptedFieldSchema.nullable().optional(),
  encrypted_line: EncryptedFieldSchema,
  encrypted_city: EncryptedFieldSchema,
  encrypted_district: EncryptedFieldSchema.nullable().optional(),
  encrypted_state: EncryptedFieldSchema,
  encrypted_postalCode: EncryptedFieldSchema,
  encrypted_country: EncryptedFieldSchema,
  encrypted_period: EncryptedFieldSchema.nullable().optional(),
})

export const EncryptedTaskSchema = z.object({
  resident_id: z.string(),
  careplan_id: z.string().nullable().optional(),
  encrypted_dek: z.string(),
  encrypted_activity_code: EncryptedFieldSchema.nullable().optional(),
  encrypted_status: EncryptedFieldSchema,
  encrypted_intent: EncryptedFieldSchema,
  encrypted_priority: EncryptedFieldSchema,
  encrypted_requested_period: EncryptedFieldSchema,
  encrypted_execution_period: EncryptedFieldSchema,
  encrypted_performer_id: EncryptedFieldSchema,
  encrypted_performer_name: EncryptedFieldSchema.nullable().optional(),
  encrypted_notes: EncryptedFieldSchema.nullable().optional(),
  encrypted_outcome: EncryptedFieldSchema.nullable().optional(),
  encrypted_authored_on: EncryptedFieldSchema,
  encrypted_last_modified: EncryptedFieldSchema,
  encrypted_do_not_perform: EncryptedFieldSchema,
  encrypted_created_at: EncryptedFieldSchema,
  encrypted_updated_at: EncryptedFieldSchema,
  encrypted_viewed_at: EncryptedFieldSchema,
})

export const EncryptedProcedureSchema = z.object({
  subject_id: z.string(),
  careplan_id: z.string().nullable().optional(),
  encounter_id: z.string().nullable().optional(),
  encrypted_dek: z.string(),
  encrypted_focus: EncryptedFieldSchema,
  encrypted_code: EncryptedFieldSchema,
  encrypted_status: EncryptedFieldSchema,
  encrypted_occurrence: EncryptedFieldSchema,
  encrypted_category: EncryptedFieldSchema,
  encrypted_body_site: EncryptedFieldSchema,
  performer: z.object({
    id: z.string().optional(), // Plaintext for querying
    encrypted_name: EncryptedFieldSchema.optional(),
    encrypted_period: EncryptedFieldSchema,
  }),
  encrypted_notes: EncryptedFieldSchema.nullable().optional(),
  encrypted_outcome: EncryptedFieldSchema.nullable().optional(),
  encrypted_recorded_at: EncryptedFieldSchema,
})

export const EncryptedEncounterSchema = z.object({
  subject_id: z.string(),
  episodes_of_care_id: z.string(),
  encrypted_dek: z.string(),
  encrypted_type: EncryptedFieldSchema,
  encrypted_status: EncryptedFieldSchema,
  encrypted_period: EncryptedFieldSchema.nullable().optional(),
  encrypted_diagnosis: EncryptedFieldSchema.optional(), // -- Add these later...
  encrypted_reason: EncryptedFieldSchema.optional(),
  encrypted_location: EncryptedFieldSchema.nullable().optional(),
  encrypted_participant_id: EncryptedFieldSchema.nullable().optional(),
  encrypted_participant_name: EncryptedFieldSchema.nullable().optional(),
  encrypted_service_provider_id: EncryptedFieldSchema.nullable().optional(),
  encrypted_account_id: EncryptedFieldSchema.nullable().optional(),
  encrypted_notes: EncryptedFieldSchema.nullable().optional(),
  encrypted_recorded_at: EncryptedFieldSchema,
})
