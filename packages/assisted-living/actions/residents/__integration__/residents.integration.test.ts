import { addNewResident } from '#root/actions/residents/add'
import { deleteResidentData } from '#root/actions/residents/delete'
import {
  getNestedResidentData,
  getResidentData,
  getResidents,
} from '#root/actions/residents/get'
import { updateAllergies } from '#root/actions/residents/update-allergies'
import { verifySession } from '#root/auth/server/definitions'
import { setCryptoProviderForTesting } from '#root/lib/crypto'
import { plaintextProvider } from '#root/lib/crypto/plaintext-provider'
import type { Resident } from '#root/types/schemas/administrative/resident'
import {
  clearFirestore,
  getStoredResident,
  getStoredSubcollection,
  listResidentIds,
  seedFacility,
  setSubcollectionDoc,
} from '#root/test-data/emulatorSetup'
import { fakeCryptoProvider } from '#root/test-data/fakeCrypto'

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

function plaintextAllergyDoc(residentId: string) {
  return {
    crypto_scheme: 'none:v1',
    resident_id: residentId,
    recorder_id: 'user-1',
    clinical_status: 'active',
    verification_status: 'confirmed',
    type: 'allergy',
    name: { coding: [], text: 'Peanuts' },
    recorded_date: '2026-01-01',
    substance: { coding: [], text: 'Peanut' },
    reaction: { code: { coding: [], text: 'Hives' }, severity: 'mild' },
  }
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
  setCryptoProviderForTesting(fakeCryptoProvider)
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

  it('persists only the fields that were provided', async () => {
    const result = await addNewResident({
      facility_id: 'FAC-1',
      room_no: '102',
      avatar_url: 'https://example.com/a.png',
      dob: '1940-05-05',
      pcp: 'Dr. Smith',
    })
    expect(result.success).toBe(true)

    const [id] = await listResidentIds()
    const resident = await getResidentData(id)
    expect(resident.room_no).toBe('102')
    expect(resident.resident_name).toBeUndefined()
  })

  it('does not persist a resident with missing required fields', async () => {
    const result = await addNewResident({ room_no: '101' } as any)
    expect(result.success).toBe(false)
    expect(await listResidentIds()).toHaveLength(0)
  })

  it('lists multiple residents', async () => {
    await createResident()
    mockVerifySession.mockResolvedValue(adminClaims)
    const second = await addNewResident({
      ...residentInput,
      room_no: '102',
      resident_name: 'John Roe',
    })
    expect(second.success).toBe(true)

    const all = await getResidents()
    expect(all).toHaveLength(2)
    expect(all.map((r) => r.resident_name).sort()).toEqual([
      'Jane Doe',
      'John Roe',
    ])
  })

  it('rejects reading a non-existent resident', async () => {
    await expect(getResidentData('does-not-exist')).rejects.toThrow(
      /Failed to fetch resident/,
    )
  })

  it('returns an empty list for a resident with no allergies', async () => {
    const id = await createResident()
    await expect(
      getNestedResidentData('GYRHOME', id, 'allergies'),
    ).resolves.toEqual([])
  })

  it('enforces role-gated decryption of the resident record', async () => {
    const id = await createResident()

    for (const roles of [['ADMIN'], ['CLINICIAN']]) {
      mockVerifySession.mockResolvedValue({
        provider_id: 'GYRHOME',
        uid: 'u',
        roles,
      })
      await expect(getResidentData(id)).resolves.toBeDefined()
    }

    for (const roles of [['CAREGIVER'], ['VIEWER']]) {
      mockVerifySession.mockResolvedValue({
        provider_id: 'GYRHOME',
        uid: 'u',
        roles,
      })
      await expect(getResidentData(id)).rejects.toThrow()
    }
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

  it('fails closed when a plaintext document is read in envelope mode', async () => {
    const id = await createResident()
    await setSubcollectionDoc(
      id,
      'allergies',
      'plain-1',
      plaintextAllergyDoc(id),
    )

    await expect(
      getNestedResidentData('GYRHOME', id, 'allergies'),
    ).rejects.toThrow(/Crypto scheme mismatch/)
  })

  it('fails closed when an envelope document is read in plaintext mode', async () => {
    const id = await createResident()
    await updateAllergies([allergyInput], id)

    setCryptoProviderForTesting(plaintextProvider)

    await expect(
      getNestedResidentData('GYRHOME', id, 'allergies'),
    ).rejects.toThrow(/Crypto scheme mismatch/)
  })

  it('reads a plaintext document in plaintext mode', async () => {
    const id = await createResident()
    await setSubcollectionDoc(
      id,
      'allergies',
      'plain-1',
      plaintextAllergyDoc(id),
    )

    setCryptoProviderForTesting(plaintextProvider)

    const allergies = await getNestedResidentData('GYRHOME', id, 'allergies')
    expect(allergies).toHaveLength(1)
    expect(allergies[0].name.text).toBe('Peanuts')
    expect(allergies[0].patient.reference).toBe(`Patient/${id}`)
  })
})
