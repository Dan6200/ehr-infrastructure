import { addNewResident } from '#root/actions/residents/add'
import { deleteResidentData } from '#root/actions/residents/delete'
import {
  getNestedResidentData,
  getResidentData,
  getResidents,
} from '#root/actions/residents/get'
import { updateAllergies } from '#root/actions/residents/update-allergies'
import { updateAdjustments } from '#root/actions/residents/update-adjustments'
import { updateCharges } from '#root/actions/residents/update-charges'
import { updateDiagnosticHistory } from '#root/actions/residents/update-diagnostic-history'
import { updateObservations } from '#root/actions/residents/update-observations'
import { updatePayments } from '#root/actions/residents/update-payments'
import { updatePrescriptions } from '#root/actions/residents/update-prescriptions'
import { updateResident } from '#root/actions/residents/update'
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

const observationInput = {
  id: '',
  status: 'final' as const,
  category: [{ coding: [], text: 'Vital Signs' }],
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

const diagnosticInput = {
  id: '',
  clinical_status: 'active' as const,
  recorded_date: '2026-01-01',
  onset_datetime: '2025-12-01',
  abatement_datetime: null,
  title: 'Hypertension',
  code: { coding: [], text: 'Hypertension' },
}

const prescriptionInput = {
  id: '',
  period: { start: '2026-01-01', end: '2026-02-01' },
  status: 'active' as const,
  adherence: 'taking' as const,
  medication: { code: { coding: [] }, strength: { value: 1, unit: 'mg' } },
  dosage_instruction: [],
}

const chargeInput = {
  id: '',
  service: 'Physiotherapy',
  quantity: 3,
  unit_price: { value: 12.5, currency: 'NGN' },
  occurrence_datetime: '2026-01-01T00:00:00.000Z',
  description: 'Session',
}

const paymentInput = {
  id: '',
  amount: { value: 100, currency: 'NGN' },
  payor: 'NHIS',
  occurrence_datetime: '2026-01-01T00:00:00.000Z',
  method: 'EFT',
}

const adjustmentInput = {
  id: '',
  claim_id: 'claim-1',
  reason: 'Contractual',
  approved_amount: { value: 50, currency: 'NGN' },
  authored_on: '2026-01-01',
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

  it('deletes resident subcollection documents recursively', async () => {
    const id = await createResident()
    await setSubcollectionDoc(id, 'allergies', 'allergy-1', {
      resident_id: id,
      name: 'Peanuts',
    })

    expect(await getStoredSubcollection(id, 'allergies')).toHaveLength(1)

    const deleted = await deleteResidentData(id)

    expect(deleted.success).toBe(true)
    expect(await getStoredSubcollection(id, 'allergies')).toHaveLength(0)
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

describe('subcollection write actions against the Firestore emulator', () => {
  it('writes and reads an observation (JSON fields)', async () => {
    const id = await createResident()
    expect((await updateObservations([observationInput], id)).success).toBe(
      true,
    )

    const observations = await getNestedResidentData(
      'GYRHOME',
      id,
      'observations',
    )
    expect(observations).toHaveLength(1)
    expect(observations[0].code.text).toBe('Blood pressure')
    expect(observations[0].category[0].text).toBe('Vital Signs')
    expect(observations[0].value_quantity.value).toBe(120)
  })

  it('writes and reads a diagnostic history record', async () => {
    const id = await createResident()
    expect((await updateDiagnosticHistory([diagnosticInput], id)).success).toBe(
      true,
    )

    const records = await getNestedResidentData(
      'GYRHOME',
      id,
      'diagnostic_history',
    )
    expect(records).toHaveLength(1)
    expect(records[0].title).toBe('Hypertension')
    expect(records[0].code.text).toBe('Hypertension')
  })

  it('writes and reads a prescription (period and dosage)', async () => {
    const id = await createResident()
    expect((await updatePrescriptions([prescriptionInput], id)).success).toBe(
      true,
    )

    const prescriptions = await getNestedResidentData(
      'GYRHOME',
      id,
      'prescriptions',
    )
    expect(prescriptions).toHaveLength(1)
    expect(prescriptions[0].status).toBe('active')
    expect(prescriptions[0].period.start).toBe('2026-01-01')
    expect(prescriptions[0].dosage_instruction).toEqual([])
  })

  it('writes and reads a charge', async () => {
    const id = await createResident()
    expect((await updateCharges([chargeInput], id)).success).toBe(true)

    const charges = await getNestedResidentData('GYRHOME', id, 'charges')
    expect(charges).toHaveLength(1)
    expect(charges[0].service).toBe('Physiotherapy')
    expect(charges[0].unit_price.value).toBe(12.5)
    expect(charges[0].quantity).toBe(3)
  })

  it('writes and reads a payment', async () => {
    const id = await createResident()
    expect((await updatePayments([paymentInput], id)).success).toBe(true)

    const payments = await getNestedResidentData('GYRHOME', id, 'payments')
    expect(payments).toHaveLength(1)
    expect(payments[0].payor).toBe('NHIS')
    expect(payments[0].amount.value).toBe(100)
  })

  it('writes and reads an adjustment', async () => {
    const id = await createResident()
    expect((await updateAdjustments([adjustmentInput], id)).success).toBe(true)

    const adjustments = await getNestedResidentData(
      'GYRHOME',
      id,
      'adjustments',
    )
    expect(adjustments).toHaveLength(1)
    expect(adjustments[0].reason).toBe('Contractual')
    expect(adjustments[0].approved_amount.value).toBe(50)
  })

  it('writes a plaintext charge in plaintext mode', async () => {
    const id = await createResident()
    setCryptoProviderForTesting(plaintextProvider)

    expect((await updateCharges([chargeInput], id)).success).toBe(true)

    const stored = await getStoredSubcollection(id, 'charges')
    expect(stored[0].crypto_scheme).toBe('none:v1')
    expect(stored[0]).not.toHaveProperty('encrypted_dek')

    const charges = await getNestedResidentData('GYRHOME', id, 'charges')
    expect(charges).toHaveLength(1)
    expect(charges[0].service).toBe('Physiotherapy')
    expect(charges[0].unit_price.value).toBe(12.5)
  })
})

describe('write authorization', () => {
  function asRole(roles: string[]) {
    mockVerifySession.mockResolvedValue({
      provider_id: 'GYRHOME',
      uid: 'actor',
      roles,
    })
  }

  it('denies a VIEWER writing a clinical subcollection and persists nothing', async () => {
    const id = await createResident()
    asRole(['VIEWER'])

    const result = await updateAllergies([allergyInput], id)
    expect(result.success).toBe(false)
    expect(await getStoredSubcollection(id, 'allergies')).toHaveLength(0)
  })

  it('denies a CAREGIVER writing a clinical subcollection', async () => {
    const id = await createResident()
    asRole(['CAREGIVER'])

    expect((await updateAllergies([allergyInput], id)).success).toBe(false)
    expect(await getStoredSubcollection(id, 'allergies')).toHaveLength(0)
  })

  it('allows a CLINICIAN writing a clinical subcollection', async () => {
    const id = await createResident()
    asRole(['CLINICIAN'])

    expect((await updateAllergies([allergyInput], id)).success).toBe(true)
    expect(await getStoredSubcollection(id, 'allergies')).toHaveLength(1)
  })

  it('denies a VIEWER writing a financial subcollection and persists nothing', async () => {
    const id = await createResident()
    asRole(['VIEWER'])

    expect((await updateCharges([chargeInput], id)).success).toBe(false)
    expect(await getStoredSubcollection(id, 'charges')).toHaveLength(0)
  })

  it('denies a CLINICIAN writing a financial subcollection', async () => {
    const id = await createResident()
    asRole(['CLINICIAN'])

    expect((await updateCharges([chargeInput], id)).success).toBe(false)
    expect(await getStoredSubcollection(id, 'charges')).toHaveLength(0)
  })

  it('denies a VIEWER updating clinical resident fields', async () => {
    const id = await createResident()
    asRole(['VIEWER'])

    const result = await updateResident(
      { facility_id: 'FAC-1', room_no: '102', pcp: 'Dr. X' },
      id,
    )
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/clinical/i)
  })

  it('denies a VIEWER updating contact resident fields', async () => {
    const id = await createResident()
    asRole(['VIEWER'])

    const result = await updateResident(
      { facility_id: 'FAC-1', room_no: '102', dob: '1960-01-01' },
      id,
    )
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/contact/i)
  })
})

describe('key rotation', () => {
  // Known bug (#15): updateResident rotates the four DEKs but only re-encrypts
  // the fields in the partial payload, so untouched fields remain encrypted
  // under DEKs that are no longer stored. The rotation-aware fake provider turns
  // this into a decryption failure. Marked `failing` so it stays green while the
  // bug is open; when #15 is fixed this test will start passing and Jest will
  // flag it, prompting the flip to a normal `it`.
  it.failing(
    'a partial resident update leaves untouched fields readable (#15)',
    async () => {
      const id = await createResident()

      const result = await updateResident(
        { facility_id: 'FAC-1', room_no: '102' },
        id,
      )
      expect(result.success).toBe(true)

      const resident = await getResidentData(id)
      expect(resident.resident_name).toBe('Jane Doe')
    },
  )
})
