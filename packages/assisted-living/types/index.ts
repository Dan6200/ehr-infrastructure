import { z } from 'zod'
import {
  AllergySchema,
  DiagnosticHistorySchema,
  EmarRecordSchema,
  ObservationSchema,
  PrescriptionSchema,
  ResidentSchema,
  EmergencyContactSchema,
  ChargeSchema,
  ClaimSchema,
  CoverageSchema,
  AdjustmentSchema,
  PaymentSchema,
  EpisodesOfCareSchema,
  CarePlanSchema,
  FacilitySchema,
} from './schemas'

// --- Exporting Plaintext Types ---
export type Observation = z.infer<typeof ObservationSchema>
export type DiagnosticHistory = z.infer<typeof DiagnosticHistorySchema>
export type Allergy = z.infer<typeof AllergySchema>
export type Prescription = z.infer<typeof PrescriptionSchema>
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type Resident = z.infer<typeof ResidentSchema>
export type EmarRecord = z.infer<typeof EmarRecordSchema>
export type Charge = z.infer<typeof ChargeSchema>
export type Claim = z.infer<typeof ClaimSchema>
export type Coverage = z.infer<typeof CoverageSchema>
export type Adjustment = z.infer<typeof AdjustmentSchema>
export type Payment = z.infer<typeof PaymentSchema>
export type EpisodeOfCare = z.infer<typeof EpisodesOfCareSchema>
export type CarePlan = z.infer<typeof CarePlanSchema>
export type Facility = z.infer<typeof FacilitySchema>
