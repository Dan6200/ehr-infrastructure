import { z } from 'zod'
import { ReferenceSchema } from '#root/types/schemas/fhir/reference'
import { makeCodec } from '../codec'
import { observationCodec } from '../codecs'

describe('makeCodec', () => {
  const domainSchema = z.object({
    id: z.string(),
    subject: ReferenceSchema,
    name: z.string(),
  })
  const encryptedSchema = z.object({
    resident_id: z.string(),
    encrypted_name: z.string(),
  })
  const codec = makeCodec({
    domainSchema,
    encryptedSchema,
    linkField: 'subject',
  })

  it('accepts the envelope shape', () => {
    expect(() =>
      codec.storedSchema.parse({
        resident_id: 'resident-1',
        encrypted_name: 'ciphertext',
      }),
    ).not.toThrow()
  })

  it('accepts the plaintext shape and rejects ambiguous documents', () => {
    expect(() =>
      codec.storedSchema.parse({
        crypto_scheme: 'none:v1',
        resident_id: 'resident-1',
        name: 'Jane',
      }),
    ).not.toThrow()

    expect(() =>
      codec.storedSchema.parse({ resident_id: 'resident-1' }),
    ).toThrow()
  })

  it('maps plaintext storage back to a domain Reference', () => {
    const domain = codec.plaintextToDomain({
      id: 'doc-1',
      crypto_scheme: 'none:v1',
      resident_id: 'resident-1',
      name: 'Jane',
    })
    expect(domain).toEqual({
      id: 'doc-1',
      subject: { reference: 'Patient/resident-1', type: 'Patient' },
      name: 'Jane',
    })
  })
})

describe('observationCodec', () => {
  const observation = {
    id: 'obs-1',
    subject: { reference: 'Patient/resident-1', type: 'Patient' },
    recorder_id: 'user-1',
    status: 'final',
    category: [],
    code: { coding: [], text: 'Blood pressure' },
    effective_datetime: '2026-01-01T00:00:00.000Z',
    value_quantity: {
      value: 120,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]',
    },
    body_site: { coding: [], text: 'Arm' },
    method: { coding: [], text: 'Manual' },
    device: { coding: [], text: 'Cuff' },
  }

  it('round-trips through the plaintext shape', () => {
    const stored = observationCodec.domainToPlaintext(
      observation,
      'resident-1',
      'user-1',
    )
    expect(stored).toMatchObject({
      crypto_scheme: 'none:v1',
      resident_id: 'resident-1',
      recorder_id: 'user-1',
      status: 'final',
    })
    expect(stored).not.toHaveProperty('encrypted_dek')

    const domain = observationCodec.plaintextToDomain({
      ...stored,
      id: 'obs-1',
    })
    expect(domain.subject).toEqual({
      reference: 'Patient/resident-1',
      type: 'Patient',
    })
    expect(domain.code.text).toBe('Blood pressure')
  })

  it('accepts a legacy envelope document', () => {
    const field = { ciphertext: 'c', iv: 'i', authTag: 't' }
    expect(() =>
      observationCodec.storedSchema.parse({
        resident_id: 'resident-1',
        recorder_id: 'user-1',
        encrypted_dek: 'wrapped-dek',
        encrypted_status: field,
        encrypted_category: field,
        encrypted_code: field,
        encrypted_effective_datetime: field,
      }),
    ).not.toThrow()
  })
})
