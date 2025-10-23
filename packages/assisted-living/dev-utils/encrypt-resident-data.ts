import {
  generateDataKey,
  encryptData,
  kmsClient,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
} from '../lib/encryption.ts'
import * as fs from 'fs'
import * as path from 'path'

// --- Configuration ---
const PLAINTEXT_INPUT_DIR = 'demo-data'
const ENCRYPTED_OUTPUT_FILE = 'demo-data/firestore-encrypted-payload.json'
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
function encryptField(value: any, dek: Buffer): any {
  if (value === null || typeof value === 'undefined') return null
  if (typeof value === 'object') return encryptData(JSON.stringify(value), dek)
  return encryptData(String(value), dek)
}

function loadPlaintextData(collectionName: string) {
  const rawDataPath = path.join(
    process.cwd(),
    `${PLAINTEXT_INPUT_DIR}/${collectionName}/data-plain.json`,
  )
  if (!fs.existsSync(rawDataPath)) {
    console.warn(
      `Warning: Plaintext data file not found for ${collectionName}. Skipping.`,
    )
    return []
  }
  return JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'))
}

// --- Main Encryption Logic ---
async function main() {
  console.log(
    '--- Starting Bulk Data Encryption to Single Streaming Payload ---',
  )

  const residents = loadPlaintextData('residents')
  const subcollectionData: { [key: string]: any[] } = {}
  SUBCOLLECTIONS.forEach((sc) => {
    subcollectionData[sc.name] = loadPlaintextData(sc.name)
  })

  console.log('Step 1: Pre-generating all DEKs for all residents...')
  const dekMap = new Map()
  for (const resident of residents) {
    const [general, contact, clinical, financial] = await Promise.all([
      generateDataKey(KEK_GENERAL_PATH),
      generateDataKey(KEK_CONTACT_PATH),
      generateDataKey(KEK_CLINICAL_PATH),
      generateDataKey(KEK_FINANCIAL_PATH),
    ])
    dekMap.set(resident.id, { general, contact, clinical, financial })
  }
  console.log('DEK generation complete.')

  const outputStream = fs.createWriteStream(
    path.join(process.cwd(), ENCRYPTED_OUTPUT_FILE),
    { encoding: 'utf-8' },
  )
  outputStream.write('{\n')
  let isFirstCollectionInFile = true

  const writeComma = () => {
    if (!isFirstCollectionInFile) {
      outputStream.write(',\n')
    }
    isFirstCollectionInFile = false
  }

  console.log('Step 2: Encrypting and streaming residents...')
  writeComma()
  outputStream.write(`  "residents": [\n`)
  residents.forEach((resident, index) => {
    const deks = dekMap.get(resident.id)
    const encryptedData: any = {
      facility_id: resident.data.facility_id,
      encrypted_dek_general: deks.general.encryptedDek.toString('base64'),
      encrypted_dek_contact: deks.contact.encryptedDek.toString('base64'),
      encrypted_dek_clinical: deks.clinical.encryptedDek.toString('base64'),
      encrypted_dek_financial: deks.financial.encryptedDek.toString('base64'),
    }

    if (resident.data.resident_name)
      encryptedData['encrypted_resident_name'] = encryptField(
        resident.data.resident_name,
        deks.general.plaintextDek,
      )
    if (resident.data.gender)
      encryptedData['encrypted_gender'] = encryptField(
        resident.data.gender,
        deks.general.plaintextDek,
      )
    if (resident.data.avatar_url)
      encryptedData['encrypted_avatar_url'] = encryptField(
        resident.data.avatar_url,
        deks.general.plaintextDek,
      )
    if (resident.data.room_no)
      encryptedData['encrypted_room_no'] = encryptField(
        resident.data.room_no,
        deks.general.plaintextDek,
      )
    if (resident.data.dob)
      encryptedData['encrypted_dob'] = encryptField(
        resident.data.dob,
        deks.contact.plaintextDek,
      )
    if (resident.data.resident_email)
      encryptedData['encrypted_resident_email'] = encryptField(
        resident.data.resident_email,
        deks.contact.plaintextDek,
      )
    if (resident.data.cell_phone)
      encryptedData['encrypted_cell_phone'] = encryptField(
        resident.data.cell_phone,
        deks.contact.plaintextDek,
      )
    if (resident.data.work_phone)
      encryptedData['encrypted_work_phone'] = encryptField(
        resident.data.work_phone,
        deks.contact.plaintextDek,
      )
    if (resident.data.home_phone)
      encryptedData['encrypted_home_phone'] = encryptField(
        resident.data.home_phone,
        deks.contact.plaintextDek,
      )
    if (resident.data.pcp)
      encryptedData['encrypted_pcp'] = encryptField(
        resident.data.pcp,
        deks.clinical.plaintextDek,
      )

    const outputItem = { id: resident.id, data: encryptedData }
    outputStream.write(
      '    ' + JSON.stringify(outputItem, null, 2).replace(/\n/g, '\n    '),
    )
    if (index < residents.length - 1) {
      outputStream.write(',\n')
    }
  })
  outputStream.write('\n  ]')

  console.log('Step 3: Encrypting and streaming subcollections...')
  const groupedSubcollectionData: { [key: string]: { [key: string]: any[] } } =
    {}
  for (const sc of SUBCOLLECTIONS) {
    const items = subcollectionData[sc.name] || []
    for (const item of items) {
      const residentId = item.data.resident_id
      if (!groupedSubcollectionData[residentId])
        groupedSubcollectionData[residentId] = {}
      if (!groupedSubcollectionData[residentId][sc.name])
        groupedSubcollectionData[residentId][sc.name] = []
      groupedSubcollectionData[residentId][sc.name].push(item)
    }
  }

  for (const residentId of Object.keys(groupedSubcollectionData)) {
    const residentSubcollections = groupedSubcollectionData[residentId]
    const deks = dekMap.get(residentId)
    if (!deks) continue

    for (const scName of Object.keys(residentSubcollections)) {
      const items = residentSubcollections[scName]
      const scConfig = SUBCOLLECTIONS.find((sc) => sc.name === scName)
      if (!items || items.length === 0 || !scConfig) continue

      const collectionPath = `residents/${residentId}/${scName}`
      console.log(`\tStreaming ${items.length} items to ${collectionPath}`)

      writeComma()
      outputStream.write(`  "${collectionPath}": [\n`)

      let dek: Buffer, encrypted_dek: string
      if (scConfig.kekPath === KEK_CLINICAL_PATH) {
        dek = deks.clinical.plaintextDek
        encrypted_dek = deks.clinical.encryptedDek.toString('base64')
      } else if (scConfig.kekPath === KEK_CONTACT_PATH) {
        dek = deks.contact.plaintextDek
        encrypted_dek = deks.contact.encryptedDek.toString('base64')
      } else if (scConfig.kekPath === KEK_FINANCIAL_PATH) {
        dek = deks.financial.plaintextDek
        encrypted_dek = deks.financial.encryptedDek.toString('base64')
      } else {
        dek = deks.general.plaintextDek
        encrypted_dek = deks.general.encryptedDek.toString('base64')
      }

      items.forEach((item, index) => {
        const encryptedData: any = { encrypted_dek }
        for (const field in item.data) {
          if (field.endsWith('_id')) continue
          encryptedData[`encrypted_${field}`] = encryptField(
            item.data[field],
            dek,
          )
        }
        const outputItem = { id: item.id, data: encryptedData }
        outputStream.write(
          '    ' + JSON.stringify(outputItem, null, 2).replace(/\n/g, '\n    '),
        )
        if (index < items.length - 1) {
          outputStream.write(',\n')
        }
      })
      outputStream.write('\n  ]')
    }
  }

  outputStream.write('\n}')
  outputStream.end()

  console.log(
    `--- Encryption complete. Payload written to ${ENCRYPTED_OUTPUT_FILE} ---`,
  )
}

main()
  .catch((err) => {
    console.error('An error occurred during the encryption process:', err)
    process.exit(1)
  })
  .finally(async () => {
    console.log('--- Closing KMS client connection. ---')
    await kmsClient.close()
  })
