import {
  generateDataKey,
  encryptData,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
} from '../tmp_build/lib/encryption.js'
import * as fs from 'fs'
import * as path from 'path'

const rawDataPath = path.join(
  process.cwd(),
  'demo-data/residents/data-plain.json',
)
const outputPath = path.join(process.cwd(), 'demo-data/residents/data.json')
const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf-8'))

async function encryptResidentData(residentData: any) {
  const encryptedData: any = {
    id: residentData.id, // Keep ID unencrypted
    data: {
      facility_id: residentData.data.facility_id, // Keep facility_id unencrypted
      room_no: residentData.data.room_no, // Keep room_no unencrypted
    },
  }

  // Generate DEKs and encrypt them
  const { plaintextDek: generalDek, encryptedDek: encryptedDekGeneral } =
    await generateDataKey(KEK_GENERAL_PATH)
  const { plaintextDek: contactDek, encryptedDek: encryptedDekContact } =
    await generateDataKey(KEK_CONTACT_PATH)
  const { plaintextDek: clinicalDek, encryptedDek: encryptedDekClinical } =
    await generateDataKey(KEK_CLINICAL_PATH)

  encryptedData.data.encrypted_dek_general =
    encryptedDekGeneral.toString('base64')
  encryptedData.data.encrypted_dek_contact =
    encryptedDekContact.toString('base64')
  encryptedData.data.encrypted_dek_clinical =
    encryptedDekClinical.toString('base64')

  // Encrypt General Data (resident_name, avatar_url)
  if (residentData.data.resident_name) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.resident_name,
      generalDek,
    )
    encryptedData.data.encrypted_resident_name = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (residentData.data.avatar_url) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.avatar_url,
      generalDek,
    )
    encryptedData.data.encrypted_avatar_url = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }

  // Encrypt Contact Data (dob, emergency_contacts, resident_email, cell_phone, work_phone, home_phone)
  if (residentData.data.dob) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.dob,
      contactDek,
    )
    encryptedData.data.encrypted_dob = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (residentData.data.resident_email) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.resident_email,
      contactDek,
    )
    encryptedData.data.encrypted_resident_email = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (residentData.data.cell_phone) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.cell_phone,
      contactDek,
    )
    encryptedData.data.encrypted_cell_phone = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (residentData.data.work_phone) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.work_phone,
      contactDek,
    )
    encryptedData.data.encrypted_work_phone = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (residentData.data.home_phone) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.home_phone,
      contactDek,
    )
    encryptedData.data.encrypted_home_phone = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }

  if (
    residentData.data.emergency_contacts &&
    residentData.data.emergency_contacts.length > 0
  ) {
    encryptedData.data.emergency_contacts = await Promise.all(
      residentData.data.emergency_contacts.map(async (contact: any) => {
        const encryptedContact: any = {}
        if (contact.contact_name) {
          const { ciphertext, iv, authTag } = encryptData(
            contact.contact_name,
            contactDek,
          )
          encryptedContact.encrypted_contact_name = {
            ciphertext: ciphertext.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
          }
        }
        if (contact.cell_phone) {
          const { ciphertext, iv, authTag } = encryptData(
            contact.cell_phone,
            contactDek,
          )
          encryptedContact.encrypted_cell_phone = {
            ciphertext: ciphertext.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
          }
        }
        if (contact.work_phone) {
          const { ciphertext, iv, authTag } = encryptData(
            contact.work_phone,
            contactDek,
          )
          encryptedContact.encrypted_work_phone = {
            ciphertext: ciphertext.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
          }
        }
        if (contact.home_phone) {
          const { ciphertext, iv, authTag } = encryptData(
            contact.home_phone,
            contactDek,
          )
          encryptedContact.encrypted_home_phone = {
            ciphertext: ciphertext.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
          }
        }
        if (contact.relationship && contact.relationship.length > 0) {
          encryptedContact.encrypted_relationship = contact.relationship.map(
            (r: string) => {
              const { ciphertext, iv, authTag } = encryptData(r, contactDek)
              return {
                ciphertext: ciphertext.toString('base64'),
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
              }
            },
          )
        }
        return encryptedContact
      }),
    )
  }

  // Encrypt Clinical Data (pcp)
  if (residentData.data.pcp) {
    const { ciphertext, iv, authTag } = encryptData(
      residentData.data.pcp,
      clinicalDek,
    )
    encryptedData.data.encrypted_pcp = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }

  return encryptedData
}

async function processAllResidents() {
  const encryptedResidents = []
  for (const resident of rawData) {
    encryptedResidents.push(await encryptResidentData(resident))
  }
  fs.writeFileSync(outputPath, JSON.stringify(encryptedResidents, null, 2), {
    encoding: 'utf-8',
  })
}

processAllResidents().catch(console.error)
