import {
  generateDataKey,
  encryptData,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH, // Import new financial KEK
} from '../lib/encryption.js'
import * as fs from 'fs'
import * as path from 'path'

// --- Helper to encrypt a single field's value ---
function encryptField(value: string | number | boolean, dek: Buffer) {
  if (value === null || typeof value === 'undefined') {
    return null
  }
  return encryptData(String(value), dek)
}

// --- Generic Subcollection Encryption Function ---
async function encryptSubcollection(collectionName: string, kekPath: string) {
  console.log(`Starting encryption for ${collectionName}...`)
  const rawDataPath = path.join(
    process.cwd(),
    `demo-data/${collectionName}/data-plain.json`,
  )
  const outputPath = path.join(
    process.cwd(),
    `demo-data/${collectionName}/data.json`,
  )

  if (!fs.existsSync(rawDataPath)) {
    console.warn(
      `Warning: Plaintext data file not found for ${collectionName} at ${rawDataPath}. Skipping.`,
    )
    return
  }

  const rawItems = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'))
  const encryptedItems = []

  for (const item of rawItems) {
    // Generate a unique, per-item DEK
    const { plaintextDek, encryptedDek } = await generateDataKey(kekPath)

    let encryptedItemData: any = {
      resident_id: item.data.resident_id, // Keep resident_id unencrypted
      encrypted_dek: encryptedDek.toString('base64'),
    }
    if (collectionName === 'prescriptions')
      encryptedItemData = {
        ...encryptedItemData,
        prescription_id: item.data.prescription_id,
        recorder_id: item.data.recorder_id,
      }

    // Encrypt all other fields within the 'data' object
    for (const field in item.data) {
      if (
        field !== 'resident_id' &&
        field !== 'prescription_id' &&
        field !== 'recorder_id'
      ) {
        encryptedItemData[`encrypted_${field}`] = encryptField(
          item.data[field],
          plaintextDek,
        )
      }
    }

    encryptedItems.push({
      id: item.id, // Keep top-level ID unencrypted
      data: encryptedItemData,
    })
  }

  fs.writeFileSync(outputPath, JSON.stringify(encryptedItems, null, 2), {
    encoding: 'utf-8',
  })
  console.log(
    `✅ Successfully encrypted ${encryptedItems.length} items for ${collectionName}.`,
  )
}

// --- Resident Data Encryption (Main Object) ---
async function encryptResident(residentData: any) {
  const encryptedData: any = {
    id: residentData.id, // Keep ID unencrypted
    data: {
      facility_id: residentData.data.facility_id, // Keep facility_id unencrypted
      room_no: residentData.data.room_no, // Keep room_no unencrypted
    },
  }

  // 1. Generate all four DEKs for the main resident object
  const { plaintextDek: generalDek, encryptedDek: encryptedDekGeneral } =
    await generateDataKey(KEK_GENERAL_PATH)
  const { plaintextDek: contactDek, encryptedDek: encryptedDekContact } =
    await generateDataKey(KEK_CONTACT_PATH)
  const { plaintextDek: clinicalDek, encryptedDek: encryptedDekClinical } =
    await generateDataKey(KEK_CLINICAL_PATH)
  const { plaintextDek: financialDek, encryptedDek: encryptedDekFinancial } =
    await generateDataKey(KEK_FINANCIAL_PATH)

  encryptedData.data.encrypted_dek_general =
    encryptedDekGeneral.toString('base64')
  encryptedData.data.encrypted_dek_contact =
    encryptedDekContact.toString('base64')
  encryptedData.data.encrypted_dek_clinical =
    encryptedDekClinical.toString('base64')
  encryptedData.data.encrypted_dek_financial =
    encryptedDekFinancial.toString('base64')

  // 2. Define which fields are encrypted by which DEK
  const dekMapping = {
    general: ['resident_name', 'avatar_url'],
    contact: [
      'dob',
      'resident_email',
      'cell_phone',
      'work_phone',
      'home_phone',
    ],
    clinical: ['pcp'],
  }

  // 3. Encrypt fields based on the mapping
  for (const dekType in dekMapping) {
    let dek: Buffer
    switch (dekType) {
      case 'general':
        dek = generalDek
        break
      case 'contact':
        dek = contactDek
        break
      case 'clinical':
        dek = clinicalDek
        break
      case 'financial':
        dek = financialDek
        break
      default:
        throw new Error('Invalid DEK type')
    }

    for (const field of (dekMapping as any)[dekType]) {
      if (residentData.data[field]) {
        encryptedData.data[`encrypted_${field}`] = encryptField(
          residentData.data[field],
          dek,
        )
      }
    }
  }

  return encryptedData
}

async function processResidents() {
  console.log('Starting encryption for residents...')
  const rawDataPath = path.join(
    process.cwd(),
    'demo-data/residents/data-plain.json',
  )
  const outputPath = path.join(process.cwd(), 'demo-data/residents/data.json')
  const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'))

  const encryptedResidents = []
  for (const resident of rawData) {
    encryptedResidents.push(await encryptResident(resident))
  }

  fs.writeFileSync(outputPath, JSON.stringify(encryptedResidents, null, 2), {
    encoding: 'utf-8',
  })
  console.log(
    `✅ Successfully encrypted ${encryptedResidents.length} resident records.`,
  )
}

// --- Main Orchestrator Function ---
async function processAllData() {
  console.log('--- Starting Full Demo Data Encryption Process ---')

  await Promise.all([
    // Encrypt the main resident objects first
    processResidents(),
    // Encrypt all subcollections
    encryptSubcollection('emergency_contacts', KEK_CONTACT_PATH),
    encryptSubcollection('allergies', KEK_CLINICAL_PATH),
    encryptSubcollection('prescriptions', KEK_CLINICAL_PATH),
    encryptSubcollection('observations', KEK_CLINICAL_PATH),
    encryptSubcollection('diagnostic_history', KEK_CLINICAL_PATH),
    encryptSubcollection('financials', KEK_FINANCIAL_PATH),
    encryptSubcollection('prescription_administration', KEK_CLINICAL_PATH),
  ])

  console.log('\n--- All data encrypted successfully! ---')
}

processAllData().catch(console.error)
