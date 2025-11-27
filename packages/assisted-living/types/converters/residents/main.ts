'use server'
import {
  generateDataKey,
  decryptDataKey,
  encryptData,
  decryptData,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { z } from 'zod'
import { EncryptedResidentSchema, Resident, ResidentSchema } from '#root/types'

export async function encryptResident(
  resident: Resident | Partial<Resident>,
): Promise<z.infer<typeof EncryptedResidentSchema>> {
  const dataToEncrypt: any = { ...resident }
  const encryptedData: any = {}

  encryptedData.facility_id = dataToEncrypt.facility_id
  if (dataToEncrypt.created_at) {
    encryptedData.created_at = dataToEncrypt.created_at
  }
  if (dataToEncrypt.deactivated_at) {
    encryptedData.deactivated_at = dataToEncrypt.deactivated_at
  }

  const { plaintextDek: generalDek, encryptedDek: encryptedDekGeneral } =
    await generateDataKey(KEK_GENERAL_PATH)
  const { plaintextDek: contactDek, encryptedDek: encryptedDekContact } =
    await generateDataKey(KEK_CONTACT_PATH)
  const { plaintextDek: clinicalDek, encryptedDek: encryptedDekClinical } =
    await generateDataKey(KEK_CLINICAL_PATH)
  const { encryptedDek: encryptedDekFinancial } =
    await generateDataKey(KEK_FINANCIAL_PATH)

  encryptedData.encrypted_dek_general = encryptedDekGeneral.toString('base64')
  encryptedData.encrypted_dek_contact = encryptedDekContact.toString('base64')
  encryptedData.encrypted_dek_clinical = encryptedDekClinical.toString('base64')
  encryptedData.encrypted_dek_financial =
    encryptedDekFinancial.toString('base64')

  if (dataToEncrypt.resident_name) {
    encryptedData.encrypted_resident_name = encryptData(
      dataToEncrypt.resident_name,
      generalDek,
    )
  }
  if (dataToEncrypt.room_no) {
    encryptedData.encrypted_room_no = encryptData(
      dataToEncrypt.room_no,
      generalDek,
    )
  }
  if (dataToEncrypt.gender) {
    encryptedData.encrypted_gender = encryptData(
      dataToEncrypt.gender,
      generalDek,
    )
  }
  if (dataToEncrypt.avatar_url) {
    encryptedData.encrypted_avatar_url = encryptData(
      dataToEncrypt.avatar_url,
      generalDek,
    )
  }
  if (dataToEncrypt.resident_email) {
    encryptedData.encrypted_resident_email = encryptData(
      dataToEncrypt.resident_email,
      contactDek,
    )
  }
  if (dataToEncrypt.cell_phone) {
    encryptedData.encrypted_cell_phone = encryptData(
      dataToEncrypt.cell_phone,
      contactDek,
    )
  }
  if (dataToEncrypt.work_phone) {
    encryptedData.encrypted_work_phone = encryptData(
      dataToEncrypt.work_phone,
      contactDek,
    )
  }
  if (dataToEncrypt.home_phone) {
    encryptedData.encrypted_home_phone = encryptData(
      dataToEncrypt.home_phone,
      contactDek,
    )
  }
  if (dataToEncrypt.dob) {
    encryptedData.encrypted_dob = encryptData(dataToEncrypt.dob, contactDek)
  }
  if (dataToEncrypt.pcp) {
    encryptedData.encrypted_pcp = encryptData(dataToEncrypt.pcp, clinicalDek)
  }

  return EncryptedResidentSchema.parse(encryptedData)
}

export async function decryptResidentData(
  data: z.infer<typeof EncryptedResidentSchema>,
  roles: string[],
  kekPaths: {
    KEK_GENERAL_PATH: string
    KEK_CONTACT_PATH: string
    KEK_CLINICAL_PATH: string
  },
): Promise<Omit<Resident, 'created_at' | 'viewed_at' | 'updated_at'>> {
  const decryptedData: Partial<Resident> = {}
  decryptedData.facility_id = data.facility_id

  if (data.created_at) {
    decryptedData.created_at = data.created_at
  }
  if (data.deactivated_at) {
    decryptedData.deactivated_at = data.deactivated_at
  }

  let generalDek: Buffer | string | Uint8Array | undefined
  let contactDek: Buffer | string | Uint8Array | undefined
  let clinicalDek: Buffer | string | Uint8Array | undefined

  const userRoles = roles.map((role) => role.toUpperCase())

  if (
    userRoles.includes('ADMIN') ||
    userRoles.includes('CLINICIAN') ||
    userRoles.includes('CAREGIVER') ||
    userRoles.includes('VIEWER')
  ) {
    if (data.encrypted_dek_general) {
      try {
        generalDek = await decryptDataKey(
          Buffer.from(data.encrypted_dek_general, 'base64'),
          kekPaths.KEK_GENERAL_PATH,
        )
      } catch (e) {
        console.error('Failed to decrypt general DEK:', e)
      }
    }
  }

  if (
    userRoles.includes('ADMIN') ||
    userRoles.includes('CLINICIAN') ||
    userRoles.includes('CAREGIVER')
  ) {
    if (data.encrypted_dek_contact) {
      try {
        contactDek = await decryptDataKey(
          Buffer.from(data.encrypted_dek_contact, 'base64'),
          kekPaths.KEK_CONTACT_PATH,
        )
      } catch (e) {
        console.error('Failed to decrypt contact DEK:', e)
      }
    }
  }

  if (userRoles.includes('ADMIN') || userRoles.includes('CLINICIAN')) {
    if (data.encrypted_dek_clinical) {
      try {
        clinicalDek = await decryptDataKey(
          Buffer.from(data.encrypted_dek_clinical, 'base64'),
          kekPaths.KEK_CLINICAL_PATH,
        )
      } catch (e) {
        console.error('Failed to decrypt clinical DEK:', e)
      }
    }
  }

  if (generalDek) {
    if (data.encrypted_resident_name)
      decryptedData.resident_name = decryptData(
        data.encrypted_resident_name,
        generalDek,
      )
    if (data.encrypted_gender)
      decryptedData.gender = decryptData(data.encrypted_gender, generalDek)
    if (data.encrypted_avatar_url)
      decryptedData.avatar_url = decryptData(
        data.encrypted_avatar_url,
        generalDek,
      )
    if (data.encrypted_room_no)
      decryptedData.room_no = decryptData(data.encrypted_room_no, generalDek)
  }

  if (contactDek) {
    if (data.encrypted_resident_email)
      decryptedData.resident_email = decryptData(
        data.encrypted_resident_email,
        contactDek,
      )
    if (data.encrypted_cell_phone)
      decryptedData.cell_phone = decryptData(
        data.encrypted_cell_phone,
        contactDek,
      )
    if (data.encrypted_work_phone)
      decryptedData.work_phone = decryptData(
        data.encrypted_work_phone,
        contactDek,
      )
    if (data.encrypted_home_phone)
      decryptedData.home_phone = decryptData(
        data.encrypted_home_phone,
        contactDek,
      )
    if (data.encrypted_dob)
      decryptedData.dob = decryptData(data.encrypted_dob, contactDek)
  }

  if (clinicalDek) {
    if (data.encrypted_pcp)
      decryptedData.pcp = decryptData(data.encrypted_pcp, clinicalDek)
  }

  return ResidentSchema.omit({
    created_at: !!1,
    viewed_at: !!1,
    updated_at: !!1,
  }).parse(decryptedData)
}

export const getResidentConverter = async (): Promise<
  FirestoreDataConverter<z.infer<typeof EncryptedResidentSchema>>
> => ({
  toFirestore(resident: z.infer<typeof EncryptedResidentSchema>): DocumentData {
    return EncryptedResidentSchema.parse(resident)
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
  ): z.infer<typeof EncryptedResidentSchema> {
    return EncryptedResidentSchema.parse(snapshot.data())
  },
})
