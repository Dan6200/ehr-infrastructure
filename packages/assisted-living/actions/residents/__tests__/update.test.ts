import { updateResident } from '../update'
import { getResidentData } from '../get'
import { loadInitialData, clearFirestore } from '#root/test-data/emulatorSetup'
import admin from 'firebase-admin'

describe('updateResident', () => {
  beforeAll(async () => {
    await clearFirestore()
  })

  beforeEach(async () => {
    await loadInitialData()
  })

  afterEach(async () => {
    await clearFirestore()
  })

  it('should update resident data successfully', async () => {
    const documentIdToUpdate = 'residentDoc1' // From test-data/residents.json
    const updatedName = 'John Doe Updated'
    const updatedResidentData = {
      resident_name: updatedName,
      facility_id: 'CC1101',
      resident_id: '1',
      emergency_contacts: [
        {
          contact_name: 'Jane Doe Updated',
          cell_phone: '999-888-7777',
        },
      ],
    }

    const result = await updateResident(updatedResidentData, documentIdToUpdate)

    expect(result.success).toBe(true)
    expect(result.message).toBe('Successfully Updated Resident Information')

    // Verify the resident was updated
    const updatedResident = await getResidentData(documentIdToUpdate)
    expect(updatedResident.resident_name).toBe(updatedName)
    expect(updatedResident.emergency_contacts?.[0]?.contact_name).toBe(
      'Jane Doe Updated',
    )
  })

  it('should return success: false if resident does not exist', async () => {
    const nonExistentDocumentId = 'nonExistentDoc'
    const updatedResidentData = {
      resident_name: 'Non Existent',
      facility_id: 'CC0000',
      resident_id: '0',
      emergency_contacts: [],
    }

    const result = await updateResident(
      updatedResidentData,
      nonExistentDocumentId,
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Failed to Update the Resident')
  })
})
