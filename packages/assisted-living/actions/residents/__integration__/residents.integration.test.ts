import { addNewResident } from '#root/actions/residents/add'
import { deleteResidentData } from '#root/actions/residents/delete'
import {
  getNestedResidentData,
  getResidentData,
  getResidents,
} from '#root/actions/residents/get'
import { updateAllergies } from '#root/actions/residents/update-allergies'
import { verifySession } from '#root/auth/server/definitions'
import type { Resident } from '#root/types/schemas/administrative/resident'
import {
  clearFirestore,
  getStoredResident,
  getStoredSubcollection,
  listResidentIds,
  seedFacility,
} from '#root/test-data/emulatorSetup'

jest.mock('#root/auth/server/definitions', () => ({
  verifySession: jest.fn(),
}))

const mockVerifySession = verifySession as jest.Mock

const adminClaims = {
  provider_id: 'GYRHOME',
  uid: 'user-1',
  roles: ['ADMIN'],
}

const residentInput: Resident = {
  facility_id: 'FAC-1',
  room_no: '101',
  avatar_url: 'https://example.com/avatar.png',
  dob: '1950-01-01',
  pcp: 'Dr. Who',
  resident_name: 'Jane Doe',
  gender: 'female',
  resident_email: 'jane@example.com',
  cell_phone: '555-0100',
}

const allergyInput = {
  id: '',
  clinical_status: 'active' as const,
  verification_status: 'confirmed' as const,
  type: 'allergy' as const,
  name: { coding: [], text: 'Peanuts' },
  recorded_date: '2026-01-01',
  substance: { coding: [], text: 'Peanut' },
  reaction: { code: { coding: [], text: 'Hives' }, severity: 'mild' },
}

async function createResident(): Promise<string> {
  mockVerifySession.mockResolvedValue(adminClaims)
  const result = await addNewResident(residentInput)
  expect(result.success).toBe(true)

  const ids = await listResidentIds()
  expect(ids).toHaveLength(1)
  return ids[0]
}

beforeEach(async () => {
  mockVerifySession.mockResolvedValue(adminClaims)
  await clearFirestore()
  await seedFacility('FAC-1', '123 Care Street')
})

afterAll(async () => {
  await clearFirestore()
})

describe('resident actions against the Firestore emulator', () => {
  it('stores an encrypted resident and reads, lists and deletes it', async () => {
    const id = await createResident()

    const stored = await getStoredResident(id)
    expect(stored?.facility_id).toBe('FAC-1')
    expect(stored?.encrypted_resident_name).toBeDefined()
    expect(stored?.encrypted_dek_general).toBeDefined()

    const resident = await getResidentData(id)
    expect(resident.resident_name).toBe('Jane Doe')
    expect(resident.room_no).toBe('101')
    expect(resident.address).toBe('123 Care Street')

    const all = await getResidents()
    expect(all.some((r) => r.resident_name === 'Jane Doe')).toBe(true)

    const deleted = await deleteResidentData(id)
    expect(deleted.success).toBe(true)
    expect(await listResidentIds()).toHaveLength(0)
  })

  it('writes the envelope allergy shape and reads it through the codec', async () => {
    const id = await createResident()

    const write = await updateAllergies([allergyInput], id)
    expect(write.success).toBe(true)

    const stored = await getStoredSubcollection(id, 'allergies')
    expect(stored).toHaveLength(1)
    expect(stored[0].resident_id).toBe(id)
    expect(stored[0].recorder_id).toBe('user-1')
    expect(stored[0].crypto_scheme).toBe('kms-envelope:v1')
    expect(stored[0].encrypted_dek).toBeDefined()
    expect(stored[0].encrypted_name).toBeDefined()

    const allergies = await getNestedResidentData('GYRHOME', id, 'allergies')
    expect(allergies).toHaveLength(1)
    expect(allergies[0].name.text).toBe('Peanuts')
    expect(allergies[0].patient.reference).toBe(`Patient/${id}`)
  })

  it('denies a clinical subcollection read for a VIEWER', async () => {
    const id = await createResident()
    await updateAllergies([allergyInput], id)

    mockVerifySession.mockResolvedValue({
      provider_id: 'GYRHOME',
      uid: 'viewer-1',
      roles: ['VIEWER'],
    })

    await expect(
      getNestedResidentData('GYRHOME', id, 'allergies'),
    ).rejects.toThrow(/Insufficient permissions/)
  })

  it('rejects a cross-provider read', async () => {
    const id = await createResident()

    await expect(
      getNestedResidentData('OTHER_PROVIDER', id, 'allergies'),
    ).rejects.toThrow(/Provider mismatch/)
  })
})
