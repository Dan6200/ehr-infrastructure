import {
  generateDataKey,
  encryptData,
  kmsClient, // Import the client to manage its lifecycle
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
  // @ts-ignore
} from '../lib/encryption.ts' // Run with node directly for speed!
import * as fs from 'fs'
import * as path from 'path'

// --- Configuration ---
const SUBCOLLECTIONS = [
  { name: 'emergency_contacts', kekPath: KEK_CONTACT_PATH },
  { name: 'allergies', kekPath: KEK_CLINICAL_PATH },
  { name: 'prescriptions', kekPath: KEK_CLINICAL_PATH },
  { name: 'observations', kekPath: KEK_CLINICAL_PATH },
  { name: 'diagnostic_history', kekPath: KEK_CLINICAL_PATH },
  { name: 'financials', kekPath: KEK_FINANCIAL_PATH },
  { name: 'prescription_administration', kekPath: KEK_CLINICAL_PATH },
]

// --- Helper Functions ---
function encryptField(value: string | number | boolean, dek: Buffer) {
  if (value === null || typeof value === 'undefined') {
    return null
  }
  return encryptData(String(value), dek)
}

function loadSubcollectionData(collectionName: string) {
  const rawDataPath = path.join(
    process.cwd(),
    `demo-data/${collectionName}/data-plain.json`,
  )
  if (!fs.existsSync(rawDataPath)) {
    console.warn(
      `Warning: Plaintext data file not found for ${collectionName}. Skipping.`,
    )
    return []
  }
  return JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'))
}

function groupDataByResident(items: any[]) {
  return items.reduce(
    (acc, item) => {
      const residentId = item.data.resident_id
      if (!acc[residentId]) {
        acc[residentId] = []
      }
      acc[residentId].push(item)
      return acc
    },
    {} as { [key: string]: any[] },
  )
}

// --- Main Encryption Logic ---
async function processAllData() {
  console.log('--- Starting Efficient Bulk Data Encryption Process ---')

  // 1. Load all data into memory
  const residents = loadSubcollectionData('residents')
  const subcollectionData: { [key: string]: { [key: string]: any[] } } = {}
  for (const sc of SUBCOLLECTIONS) {
    const items = loadSubcollectionData(sc.name)
    subcollectionData[sc.name] = groupDataByResident(items)
  }

  const encryptedResidents = []
  const encryptedSubcollections: { [key: string]: any[] } = {}
  SUBCOLLECTIONS.forEach((sc) => (encryptedSubcollections[sc.name] = []))

  // 2. Main loop through each resident
  for (const resident of residents) {
    console.log(`Processing resident ${resident.id}...`)
    const residentId = resident.id

    // a. Generate all DEKs ONCE for this resident
    const [
      { plaintextDek: generalDek, encryptedDek: encryptedDekGeneral },
      { plaintextDek: contactDek, encryptedDek: encryptedDekContact },
      { plaintextDek: clinicalDek, encryptedDek: encryptedDekClinical },
      { plaintextDek: financialDek, encryptedDek: encryptedDekFinancial },
    ] = await Promise.all([
      generateDataKey(KEK_GENERAL_PATH),
      generateDataKey(KEK_CONTACT_PATH),
      generateDataKey(KEK_CLINICAL_PATH),
      generateDataKey(KEK_FINANCIAL_PATH),
    ])

    // b. Encrypt the main resident object
    const encryptedResident: any = {
      id: residentId,
      data: {
        facility_id: resident.data.facility_id,
        encrypted_dek_general: encryptedDekGeneral.toString('base64'),
        encrypted_dek_contact: encryptedDekContact.toString('base64'),
        encrypted_dek_clinical: encryptedDekClinical.toString('base64'),
        encrypted_dek_financial: encryptedDekFinancial.toString('base64'),
      },
    }
    if (resident.data.resident_name)
      encryptedResident.data.encrypted_resident_name = encryptField(
        resident.data.resident_name,
        generalDek,
      )
    if (resident.data.gender)
      encryptedResident.data.encrypted_gender = encryptField(
        resident.data.gender,
        generalDek,
      )
    if (resident.data.avatar_url)
      encryptedResident.data.encrypted_avatar_url = encryptField(
        resident.data.avatar_url,
        generalDek,
      )
    if (resident.data.room_no)
      encryptedResident.data.encrypted_room_no = encryptField(
        resident.data.room_no,
        generalDek,
      )
    if (resident.data.dob)
      encryptedResident.data.encrypted_dob = encryptField(
        resident.data.dob,
        contactDek,
      )
    if (resident.data.resident_email)
      encryptedResident.data.encrypted_resident_email = encryptField(
        resident.data.resident_email,
        contactDek,
      )
    if (resident.data.cell_phone)
      encryptedResident.data.encrypted_cell_phone = encryptField(
        resident.data.cell_phone,
        contactDek,
      )
    if (resident.data.work_phone)
      encryptedResident.data.encrypted_work_phone = encryptField(
        resident.data.work_phone,
        contactDek,
      )
    if (resident.data.home_phone)
      encryptedResident.data.encrypted_home_phone = encryptField(
        resident.data.home_phone,
        contactDek,
      )
    if (resident.data.pcp)
      encryptedResident.data.encrypted_pcp = encryptField(
        resident.data.pcp,
        clinicalDek,
      )
    encryptedResidents.push(encryptedResident)

    // c. Encrypt all subcollection items for this resident using the DEKs generated above
    for (const sc of SUBCOLLECTIONS) {
      console.log(`\tProcessing ${sc.name} for ${residentId}...`)
      const residentItems = subcollectionData[sc.name]?.[residentId] || []
      let dek: Buffer
      if (sc.kekPath === KEK_CLINICAL_PATH) dek = clinicalDek
      else if (sc.kekPath === KEK_CONTACT_PATH) dek = contactDek
      else if (sc.kekPath === KEK_FINANCIAL_PATH) dek = financialDek
      else dek = generalDek // Fallback, though should not happen with current config

      for (const item of residentItems) {
        const encryptedItemData: any = {
          resident_id: residentId,
          prescription_id: item.data.prescription_id,
          recorder_id: item.data.recorder_id,
          dek,
        }
        for (const field in item.data) {
          if (
            field !== 'resident_id' &&
            field !== 'prescription_id' &&
            field !== 'recorder_id'
          ) {
            encryptedItemData[`encrypted_${field}`] = encryptField(
              item.data[field],
              dek,
            )
          }
        }
        encryptedSubcollections[sc.name].push({
          id: item.id,
          data: encryptedItemData,
        })
      }
    }
  }

  // 3. Write all encrypted files
  console.log('Writing encrypted files...')
  fs.writeFileSync(
    path.join(process.cwd(), 'demo-data/residents/data.json'),
    JSON.stringify(encryptedResidents, null, 2),
  )
  for (const sc of SUBCOLLECTIONS) {
    const outputPath = path.join(
      process.cwd(),
      `demo-data/${sc.name}/data.json`,
    )
    fs.writeFileSync(
      outputPath,
      JSON.stringify(encryptedSubcollections[sc.name], null, 2),
    )
  }

  console.log('--- All data encrypted successfully! ---')
}

// --- Main Execution ---
processAllData()
  .catch((err) => {
    console.error('An error occurred during the encryption process:', err)
    process.exit(1)
  })
  .finally(async () => {
    console.log('--- Closing KMS client connection. ---')
    await kmsClient.close()
  })
