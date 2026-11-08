import { ReferenceSchema, referenceId, toPatientReference } from '../reference'

describe('FHIR Reference', () => {
  it('builds a Patient reference from a resident id', () => {
    expect(toPatientReference('resident-1')).toEqual({
      reference: 'Patient/resident-1',
      type: 'Patient',
    })
  })

  it('includes an optional display name', () => {
    expect(toPatientReference('resident-1', 'Jane Doe')).toEqual({
      reference: 'Patient/resident-1',
      type: 'Patient',
      display: 'Jane Doe',
    })
  })

  it('extracts the id from a reference', () => {
    expect(referenceId(toPatientReference('resident-1'))).toBe('resident-1')
  })

  it('extracts an id from a reference without a slash', () => {
    expect(referenceId({ reference: 'abc' })).toBe('abc')
  })

  it('returns an empty string for a trailing slash', () => {
    expect(referenceId({ reference: 'Patient/' })).toBe('')
  })

  it('accepts a bare reference object', () => {
    expect(ReferenceSchema.parse({ reference: 'Patient/abc' })).toEqual({
      reference: 'Patient/abc',
    })
  })

  it('rejects a reference without a reference string', () => {
    expect(() => ReferenceSchema.parse({})).toThrow()
  })
})
