import { z } from 'zod'

const SnomedCodeSystem = z.literal('http://snomed.info/sct')
const RxNormCodeSystem = z.literal('http://snomed.info/sct')
const LoincCodeSystem = z.literal('http://snomed.info/sct')
const UCUMCodeSystem = z.literal('http://unitsofmeasure.org')
const GUDIDCodeSystem = z.literal('http://hl7.org/fhir/NamingSystem/gudid')
const TaskCodeSystem = z.literal('http://hl7.org/fhir/ValueSet/task-code')
const ObservationCategoryCodeSystem = z.literal(
  'http://terminology.hl7.org/CodeSystem/observation-category',
)
const TimingCodeSystem = z.literal(
  'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation',
)

const TaskCodeEnum = z.enum([
  'approve',
  'fulfill',
  'instantiate',
  'abort',
  'replace',
  'change',
  'suspend',
  'resume',
])

const TimingCode = z.enum([
  'BID',
  'TID',
  'QID',
  'AM',
  'PM',
  'QD',
  'QOD',
  'Q1H',
  'Q2H',
  'Q3H',
  'Q4H',
  'Q6H',
  'Q8H',
  'BED',
  'WK',
  'MO',
])

export const ObservationCategoryCodes = z.enum([
  'social-history',
  'vital-signs',
  'imaging',
  'laboratory',
  'procedure',
  'survey',
  'exam',
  'therapy',
  'activity',
])

export const TimingCodingSchema = z.object({
  system: TimingCodeSystem,
  code: TimingCode,
  display: z.string().optional(),
})

export const ObservationCategoryCodingSchema = z.object({
  system: ObservationCategoryCodeSystem,
  code: ObservationCategoryCodes,
  display: z.string().optional(),
})

export const TaskCodingSchema = z.object({
  system: TaskCodeSystem,
  code: TaskCodeEnum,
  display: z.string().optional(),
})

export const CodingSchema = z.object({
  system: z.string().url(), // or regex for known systems
  code: z.string(),
  display: z.string().optional(),
})

export const CodeableConceptSchema = z.object({
  coding: z.array(CodingSchema),
  text: z.string().optional(),
})

const UCUMCodingSchema = z.object({
  system: UCUMCodeSystem,
  code: z.string(),
  display: z.string().optional(),
})

const GUDIDCodingSchema = z.object({
  system: GUDIDCodeSystem,
  code: z.string(),
  display: z.string().optional(),
})

const LoincCodingSchema = z.object({
  system: LoincCodeSystem,
  code: z.string(),
  display: z.string().optional(),
})

const SnomedCodingSchema = z.object({
  system: SnomedCodeSystem,
  code: z.string(),
  display: z.string().optional(),
})

export const UCUMConceptSchema = z.object({
  coding: z.array(UCUMCodingSchema),
  text: z.string().optional(),
})

export const GUDIDConceptSchema = z.object({
  coding: z.array(GUDIDCodingSchema),
  text: z.string().optional(),
})

export const LoincConceptSchema = z.object({
  coding: z.array(LoincCodingSchema),
  text: z.string().optional(),
})

export const EncounterReasonUseCode = z.object({
  system: z.literal('http://hl7.org/fhir/ValueSet/encounter-reason-use'),
  code: z.enum(['CC', 'RV', 'HC', 'AD', 'HM']),
  display: z.enum([
    'Chief Complaint',
    'Reason for Visit',
    'Health Concern',
    'Admitting Diagnosis',
    'Health Maintenance',
  ]),
})

export const EncounterBusinessStatusAgedCare = z.object({
  system: z.literal(
    'http://example.org/fhir/CodeSystem/encounter-business-status-agedcare',
  ),
  code: z.enum([
    'package-active',
    'paused',
    'awaiting-approval',
    'funded',
    'respite',
    'suspended',
    'closed',
    'terminated',
  ]),
  display: z.enum([]),
})

export const EpisodesOfCareTypeCode = z.object({
  system: z.literal('http://terminology.hl7.org/CodeSystem/episodeofcare-type'),
  code: z.enum(['hacc', 'pac', 'diab', 'da', 'cacp']),
  display: z.enum([
    'Home and Community Care',
    'Post Acute Care',
    'Post coordinated diabetes program',
    'Drug and alcohol rehabilitation',
    'Community-based aged care',
  ]),
})

export const EncounterDiagnosisUseCode = z.object({
  system: z.literal('http://hl7.org/fhir/ValueSet/encounter-diagnosis-use'),
  code: z.enum(['working', 'final']),
})

export const SnomedConceptSchema = z.object({
  coding: z.array(SnomedCodingSchema),
  text: z.string().optional(),
})

const MedicationCodingSchema = z.object({
  system: z.union([SnomedCodeSystem, RxNormCodeSystem]),
  code: z.string(),
  display: z.string().optional(),
})

export const MedicationConceptSchema = z.object({
  coding: z.array(MedicationCodingSchema),
  text: z.string().optional(),
})

const CarePlanGoalSystem = z.literal(
  'http://terminology.hl7.org/5.1.0/CodeSystem-goal-category.html',
)

const CarePlanGoalCodes = z.enum([
  'dietary',
  'safety',
  'behavioral',
  'nursing',
  'physiotherapy',
])

const CarePlanGoalCodingSchema = z.object({
  system: CarePlanGoalSystem,
  code: CarePlanGoalCodes,
  display: z.string().optional(),
})

export const CarePlanGoalConceptSchema = z.object({
  coding: z.array(CarePlanGoalCodingSchema),
  text: z.string().optional(),
})

const AccountBillingStatusSystem = z.literal(
  'http://hl7.org/fhir/account-billing-status',
)

const AccountBillingStatusCodes = z.enum([
  'open',
  'carecomplete-notbilled',
  'billing',
  'closed-baddebt',
  'closed-voided',
  'closed-completed',
  'closed-combined',
])

const AccountBillingStatusCodingSchema = z.object({
  system: AccountBillingStatusSystem,
  code: AccountBillingStatusCodes,
  display: z.string().optional(),
})

export const AccountBillingStatusConceptSchema = z.object({
  coding: z.array(AccountBillingStatusCodingSchema),
  text: z.string().optional(),
})
