import {
  EncryptedAllergySchema,
  EncryptedDiagnosticHistorySchema,
  EncryptedEmarRecordSchema,
  EncryptedObservationSchema,
} from '../encrypted-schemas'

const field = { ciphertext: 'c', iv: 'i', authTag: 't' }

const linkage = {
  resident_id: 'resident-1',
  recorder_id: 'user-1',
  encrypted_dek: 'wrapped-dek',
}

describe('encrypted write documents', () => {
  it('accepts the allergy document the update action builds', () => {
    expect(() =>
      EncryptedAllergySchema.parse({
        ...linkage,
        encrypted_name: field,
        encrypted_clinical_status: field,
        encrypted_verification_status: field,
        encrypted_type: field,
        encrypted_recorded_date: field,
        encrypted_substance: field,
        encrypted_reaction: field,
      }),
    ).not.toThrow()
  })

  it('requires resident_id, recorder_id and encrypted_dek', () => {
    const parsed = EncryptedAllergySchema.safeParse({
      encrypted_name: field,
      encrypted_clinical_status: field,
      encrypted_verification_status: field,
      encrypted_type: field,
      encrypted_recorded_date: field,
      encrypted_substance: field,
      encrypted_reaction: field,
    })
    expect(parsed.success).toBe(false)
  })

  it('accepts an observation without its optional fields', () => {
    expect(() =>
      EncryptedObservationSchema.parse({
        ...linkage,
        encrypted_status: field,
        encrypted_category: field,
        encrypted_code: field,
        encrypted_effective_datetime: field,
      }),
    ).not.toThrow()
  })

  it('accepts a diagnostic record without an abatement datetime', () => {
    expect(() =>
      EncryptedDiagnosticHistorySchema.parse({
        ...linkage,
        encrypted_clinical_status: field,
        encrypted_recorded_date: field,
        encrypted_onset_datetime: field,
        encrypted_title: field,
        encrypted_code: field,
      }),
    ).not.toThrow()
  })

  it('accepts the eMAR document including prescription_id', () => {
    expect(() =>
      EncryptedEmarRecordSchema.parse({
        ...linkage,
        prescription_id: 'prescription-1',
        encrypted_medication: field,
        encrypted_status: field,
        encrypted_effective_datetime: field,
        encrypted_dosage: field,
      }),
    ).not.toThrow()
  })
})
