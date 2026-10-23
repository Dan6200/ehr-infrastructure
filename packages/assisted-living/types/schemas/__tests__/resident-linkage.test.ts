import { AllergySchema } from '../clinical/allergy'
import { ObservationSchema } from '../clinical/observation'
import { DiagnosticHistorySchema } from '../clinical/diagnostic-history'
import { PrescriptionSchema } from '../clinical/prescription'
import { EmarRecordSchema } from '../clinical/emar'
import { EpisodesOfCareSchema } from '../clinical/episodes-of-care'
import { CarePlanSchema } from '../clinical/care-plan'
import { GoalSchema } from '../clinical/goal'
import { TaskSchema } from '../clinical/task'
import { ProcedureSchema } from '../clinical/procedure'
import { EncounterSchema } from '../clinical/encounter'
import { ChargeSchema } from '../financial/charge'
import { PaymentSchema } from '../financial/payment'
import { AdjustmentSchema } from '../financial/adjustment'
import { ClaimSchema } from '../financial/claim'
import { AccountSchema } from '../financial/account'
import { CoverageSchema } from '../financial/coverage'

/**
 * Structural guard for the FHIR Reference domain rename: every resource exposes
 * exactly one FHIR patient-link field and no ad-hoc `resident_id`.
 */
const linkageCases: Array<[string, string[], string]> = [
  ['Allergy', Object.keys(AllergySchema.shape), 'patient'],
  ['Observation', Object.keys(ObservationSchema.shape), 'subject'],
  ['DiagnosticHistory', Object.keys(DiagnosticHistorySchema.shape), 'subject'],
  ['Prescription', Object.keys(PrescriptionSchema.shape), 'subject'],
  ['EmarRecord', Object.keys(EmarRecordSchema.shape), 'subject'],
  ['EpisodesOfCare', Object.keys(EpisodesOfCareSchema.shape), 'patient'],
  ['CarePlan', Object.keys(CarePlanSchema.shape), 'subject'],
  ['Goal', Object.keys(GoalSchema.shape), 'subject'],
  ['Task', Object.keys(TaskSchema.shape), 'for'],
  ['Procedure', Object.keys(ProcedureSchema.shape), 'subject'],
  ['Encounter', Object.keys(EncounterSchema.shape), 'subject'],
  ['Charge', Object.keys(ChargeSchema.shape), 'subject'],
  ['Payment', Object.keys(PaymentSchema.shape), 'subject'],
  ['Adjustment', Object.keys(AdjustmentSchema.shape), 'subject'],
  ['Claim', Object.keys(ClaimSchema.shape), 'patient'],
  ['Account', Object.keys(AccountSchema.shape), 'subject'],
  ['Coverage', Object.keys(CoverageSchema.shape), 'beneficiary'],
]

describe('FHIR Reference domain linkage', () => {
  it.each(linkageCases)(
    '%s exposes `%s` and no `resident_id`',
    (_name, keys, field) => {
      expect(keys).toContain(field)
      expect(keys).not.toContain('resident_id')
    },
  )
})
