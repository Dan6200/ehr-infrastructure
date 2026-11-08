import { canAccessKekType, KEK_TYPE_ROLES } from '../access-control'

describe('canAccessKekType', () => {
  it('matches the documented role -> KEK-class matrix', () => {
    expect(KEK_TYPE_ROLES).toEqual({
      general: ['ADMIN', 'CLINICIAN', 'CAREGIVER', 'VIEWER'],
      contact: ['ADMIN', 'CLINICIAN', 'CAREGIVER'],
      clinical: ['ADMIN', 'CLINICIAN'],
      financial: ['ADMIN'],
    })
  })

  it('allows a VIEWER only the general class', () => {
    expect(canAccessKekType(['VIEWER'], 'general')).toBe(true)
    expect(canAccessKekType(['VIEWER'], 'contact')).toBe(false)
    expect(canAccessKekType(['VIEWER'], 'clinical')).toBe(false)
    expect(canAccessKekType(['VIEWER'], 'financial')).toBe(false)
  })

  it('allows a CAREGIVER general and contact only', () => {
    expect(canAccessKekType(['CAREGIVER'], 'general')).toBe(true)
    expect(canAccessKekType(['CAREGIVER'], 'contact')).toBe(true)
    expect(canAccessKekType(['CAREGIVER'], 'clinical')).toBe(false)
    expect(canAccessKekType(['CAREGIVER'], 'financial')).toBe(false)
  })

  it('allows a CLINICIAN general, contact and clinical only', () => {
    expect(canAccessKekType(['CLINICIAN'], 'general')).toBe(true)
    expect(canAccessKekType(['CLINICIAN'], 'contact')).toBe(true)
    expect(canAccessKekType(['CLINICIAN'], 'clinical')).toBe(true)
    expect(canAccessKekType(['CLINICIAN'], 'financial')).toBe(false)
  })

  it('allows an ADMIN every class', () => {
    expect(canAccessKekType(['ADMIN'], 'general')).toBe(true)
    expect(canAccessKekType(['ADMIN'], 'contact')).toBe(true)
    expect(canAccessKekType(['ADMIN'], 'clinical')).toBe(true)
    expect(canAccessKekType(['ADMIN'], 'financial')).toBe(true)
  })

  it('is case-insensitive and accepts multiple roles', () => {
    expect(canAccessKekType(['viewer'], 'general')).toBe(true)
    expect(canAccessKekType(['VIEWER', 'CAREGIVER'], 'clinical')).toBe(false)
    expect(canAccessKekType(['VIEWER', 'CLINICIAN'], 'clinical')).toBe(true)
  })

  it('denies undefined or empty roles', () => {
    expect(canAccessKekType(undefined, 'general')).toBe(false)
    expect(canAccessKekType([], 'general')).toBe(false)
  })

  it('denies unknown roles', () => {
    expect(canAccessKekType(['SUPERUSER'], 'financial')).toBe(false)
  })

  it('does not treat an empty-string role as authorized', () => {
    expect(canAccessKekType([''], 'general')).toBe(false)
  })
})
