import {
  generateDataKey,
  encryptData,
  kmsClient,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
  // @ts-ignore ... using node to run directly so ts ext is fine
} from './lib/encryption.ts'
import * as fs from 'fs'
// @ts-ignore ... can't find type def, not making a .d.ts either
import JSONStream from 'minipass-json-stream'

// --- Configuration ---
const PLAINTEXT_INPUT_DIR = '/app/demo-data' // /app directory for the container
const ENCRYPTED_OUTPUT_FILE = '/app/demo-data/firestore-encrypted-payload.jsonl'
const SUBCOLLECTIONS = [
  { name: 'emergency_contacts', kekPath: KEK_CONTACT_PATH },
  { name: 'allergies', kekPath: KEK_CLINICAL_PATH },
  { name: 'prescriptions', kekPath: KEK_CLINICAL_PATH },
  { name: 'observations', kekPath: KEK_CLINICAL_PATH },
  { name: 'diagnostic_history', kekPath: KEK_CLINICAL_PATH },
  { name: 'accounts', kekPath: KEK_FINANCIAL_PATH },
  { name: 'charges', kekPath: KEK_FINANCIAL_PATH },
  { name: 'claims', kekPath: KEK_FINANCIAL_PATH },
  { name: 'coverages', kekPath: KEK_FINANCIAL_PATH },
  { name: 'payments', kekPath: KEK_FINANCIAL_PATH },
  { name: 'adjustments', kekPath: KEK_FINANCIAL_PATH },
  { name: 'prescription_administration', kekPath: KEK_CLINICAL_PATH },
  { name: 'care_plans', kekPath: KEK_CLINICAL_PATH },
  { name: 'care_plan_activities', kekPath: KEK_CLINICAL_PATH },
  { name: 'episodes_of_care', kekPath: KEK_CLINICAL_PATH },
  { name: 'tasks', kekPath: KEK_CLINICAL_PATH },
  { name: 'procedures', kekPath: KEK_CLINICAL_PATH },
  { name: 'encounters', kekPath: KEK_CLINICAL_PATH },
  { name: 'goals', kekPath: KEK_CLINICAL_PATH },
  { name: 'identifiers', kekPath: KEK_GENERAL_PATH },
  { name: 'addresses', kekPath: KEK_CONTACT_PATH },
]

// --- Helper Functions ---
function encryptField(value: any, dek: Buffer): any {
  if (value === null || typeof value === 'undefined') return null
  if (typeof value === 'object') return encryptData(JSON.stringify(value), dek)
  return encryptData(String(value), dek)
}

const MAX_IN_MEMORY_SIZE = 1_000_000 // 1MB

/**
 * Loads plaintext data from a JSON file, streaming individual records for large files.
 * @param collectionName The name of the Firestore collection.
 * @yields {Object} Each individual JSON object/record from the file.
 */
async function* loadPlaintextData(collectionName: string) {
  const rawDataPath = `${PLAINTEXT_INPUT_DIR}/${collectionName}/data-plain.json`

  if (!fs.existsSync(rawDataPath)) {
    console.warn(
      `Warning: Plaintext data file not found for ${collectionName}. Skipping.`,
    )
    return // Generators should use return without a value, or just end
  }

  const fileSize = fs.statSync(rawDataPath).size

  if (fileSize > MAX_IN_MEMORY_SIZE) {
    console.log(`Streaming large file: ${collectionName}`)

    const readStream = fs.createReadStream(rawDataPath)
    const jsonStream = JSONStream.parse('*')
    readStream.pipe(jsonStream)

    let chunk = []
    for await (const doc of jsonStream) {
      chunk.push(doc)
      if (chunk.length > 99_999) {
        yield chunk
        chunk = []
      }
    }
  } else {
    console.log(`Reading small file: ${collectionName} into memory.`)
    const rawContent = fs.readFileSync(rawDataPath, 'utf-8')
    const data = JSON.parse(rawContent)
    yield data
  }
}

// --- Main Encryption Logic ---
async function main() {
  console.log(
    '--- Starting Bulk Data Encryption to Single Streaming Payload ---',
  )

  const residents = (await loadPlaintextData('residents').next()).value
  const subcollectionData: { [key: string]: any[] } = {}
  for (const sc of SUBCOLLECTIONS) {
    for await (const data of loadPlaintextData(sc.name)) {
      if (subcollectionData[sc.name]) {
        const oldData = [...subcollectionData[sc.name]]
        subcollectionData[sc.name] = oldData.concat(data)
      } else subcollectionData[sc.name] = data
    }
  }

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

  const outputStream = fs.createWriteStream(ENCRYPTED_OUTPUT_FILE, {
    encoding: 'utf-8',
  })
  let isFirstEntryInFile = true

  const writeNewline = () => {
    if (!isFirstEntryInFile) {
      outputStream.write('\n')
    }
    isFirstEntryInFile = false
  }

  console.log('Step 2: Encrypting and streaming residents...')
  writeNewline()
  residents.forEach((resident: any, index: any) => {
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

    const outputItem = { path: 'residents/' + resident.id, data: encryptedData }
    outputStream.write(JSON.stringify(outputItem))
    if (index < residents.length - 1) {
      writeNewline()
    }
  })

  console.log('Step 3: Encrypting and streaming subcollections...')
  const groupedSubcollectionData: { [key: string]: { [key: string]: any[] } } =
    {}
  for (const sc of SUBCOLLECTIONS) {
    const items = subcollectionData[sc.name] || []
    for (const item of items) {
      if (!item.data) console.log(item.data)
      const residentId =
        item.data.resident_id ??
        item.data.beneficiary_id ??
        item.data.subject?.id
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
      console.log(`\tStreaming ${items.length} items from ${collectionPath}`)

      writeNewline()

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
          if (field.endsWith('_id')) {
            encryptedData[field] = item.data[field]
            continue
          }
          encryptedData[`encrypted_${field}`] = encryptField(
            item.data[field],
            dek,
          )
        }
        const outputItem = {
          path: collectionPath + '/' + item.id,
          data: encryptedData,
        }
        outputStream.write(JSON.stringify(outputItem))
        if (index < items.length - 1) {
          writeNewline()
        }
      })
    }
  }

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
    // Skip to debug
    console.log('--- Closing KMS client connection. ---')
    await kmsClient.close()
  })
