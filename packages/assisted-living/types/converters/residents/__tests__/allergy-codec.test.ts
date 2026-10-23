import {
  PlaintextAllergyStorageSchema,
  StoredAllergySchema,
  allergyToPlaintextStorage,
  isPlaintextAllergy,
  plaintextAllergyToDomain,
} from '../allergy-codec'

const plaintextDoc = {
  crypto_scheme: 'none:v1' as const,
  resident_id: 'resident-1',
  recorder_id: 'user-1',
  clinical_status: 'active' as const,
  verification_status: 'confirmed' as const,
  type: 'allergy' as const,
  name: { coding: [], text: 'Peanuts' },
  recorded_date: '2026-01-01',
  substance: { coding: [], text: 'Peanut' },
  reaction: { code: { coding: [], text: 'Hives' }, severity: 'mild' },
}

const envelopeField = { ciphertext: 'c', iv: 'i', authTag: 't' }

describe('allergy storage codec', () => {
  it('parses the plaintext storage shape', () => {
    expect(PlaintextAllergyStorageSchema.parse(plaintextDoc)).toEqual(
      plaintextDoc,
    )
  })

  it('detects plaintext documents', () => {
    expect(isPlaintextAllergy(plaintextDoc)).toBe(true)
  })

  it('maps a plaintext document to the domain shape', () => {
    const allergy = plaintextAllergyToDomain({
      ...plaintextDoc,
      id: 'allergy-1',
    })
    expect(allergy.id).toBe('allergy-1')
    expect(allergy.patient).toEqual({
      reference: 'Patient/resident-1',
      type: 'Patient',
    })
    expect(allergy.name.text).toBe('Peanuts')
    expect(allergy.recorder_id).toBe('user-1')
  })

  it('encodes a domain record into the plaintext storage shape', () => {
    const domain = plaintextAllergyToDomain({
      ...plaintextDoc,
      id: 'allergy-1',
    })
    const { id, patient, recorder_id, ...rest } = domain
    const stored = allergyToPlaintextStorage(rest, 'resident-2', 'user-2')

    expect(stored).toMatchObject({
      crypto_scheme: 'none:v1',
      resident_id: 'resident-2',
      recorder_id: 'user-2',
      name: { text: 'Peanuts' },
    })
    expect(stored).not.toHaveProperty('encrypted_dek')
    expect(stored).not.toHaveProperty('encrypted_name')
  })

  it('accepts a legacy envelope document without a scheme marker', () => {
    expect(() =>
      StoredAllergySchema.parse({
        resident_id: 'resident-1',
        recorder_id: 'user-1',
        encrypted_dek: 'wrapped-dek',
        encrypted_name: envelopeField,
        encrypted_clinical_status: envelopeField,
        encrypted_verification_status: envelopeField,
        encrypted_type: envelopeField,
        encrypted_recorded_date: envelopeField,
        encrypted_substance: envelopeField,
        encrypted_reaction: envelopeField,
      }),
    ).not.toThrow()
  })

  it('rejects a document that is neither shape', () => {
    expect(() =>
      StoredAllergySchema.parse({
        resident_id: 'resident-1',
        recorder_id: 'user-1',
      }),
    ).toThrow()
  })
})
