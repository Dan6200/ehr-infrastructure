export type Nullable<T> = T | null | undefined

import { z } from 'zod'
import { encrypt, decrypt } from '@/lib/encryption'
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore'

// --- Plaintext Schemas (for Application Use) ---
export const EmergencyContactSchema = z.object({
  contact_name: z.string().nullable().optional(),
  cell_phone: z.string(),
  work_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
})

export const ResidentSchema = z.object({
  resident_name: z.string().nullable().optional(),
  facility_id: z.string(),
  roomNo: z.string(),
  avatarUrl: z.string(),
  emergencyContacts: z.array(EmergencyContactSchema).nullable().optional(),
})

// --- Encrypted Schemas (for Firestore Storage) ---
const EncryptedEmergencyContactSchema = z.object({
  encrypted_contact_name: z.string().nullable().optional(),
  encrypted_cell_phone: z.string(),
  encrypted_work_phone: z.string().nullable().optional(),
  encrypted_home_phone: z.string().nullable().optional(),
  encrypted_relationship: z.string().nullable().optional(),
})

const EncryptedResidentSchema = z.object({
  encrypted_resident_name: z.string().nullable().optional(),
  facility_id: z.string(),
  roomNo: z.string(),
  avatarUrl: z.string(),
  emergencyContacts: z
    .array(EncryptedEmergencyContactSchema)
    .nullable()
    .optional(),
})

// --- Types ---
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>
export type Resident = z.infer<typeof ResidentSchema>

// --- Other Schemas & Types (unchanged) ---
export const FacilitySchema = z.object({
  address: z.string(),
})
export type Facility = z.infer<typeof FacilitySchema>

export const ResidentDataSchema = z.object({
  resident_name: z.string().nullable().optional(),
  id: z.string(),
  address: z.string(),
  facility_id: z.string(),
  roomNo: z.string(),
  avatarUrl: z.string(),
  emergencyContacts: z.array(EmergencyContactSchema).nullable().optional(),
})
export type ResidentData = z.infer<typeof ResidentDataSchema>

// --- Converters ---
export const createResidentConverter = (
  encryptionKey: string,
): FirestoreDataConverter<Resident> => ({
  toFirestore(resident: Resident): DocumentData {
    const dataToEncrypt: any = { ...resident }
    const encryptedData: any = {}

    // Map and encrypt fields
    encryptedData.resident_id = dataToEncrypt.resident_id
    encryptedData.facility_id = dataToEncrypt.facility_id
    encryptedData.roomNo = dataToEncrypt.roomNo
    encryptedData.avatarUrl = dataToEncrypt.avatarUrl

    if (dataToEncrypt.resident_name) {
      encryptedData.encrypted_resident_name = encrypt(
        dataToEncrypt.resident_name,
        encryptionKey,
      )
    }

    if (dataToEncrypt.emergencyContacts) {
      encryptedData.emergencyContacts = dataToEncrypt.emergencyContacts.map(
        (contact: any) => {
          const encryptedContact: any = {}
          if (contact.contact_name)
            encryptedContact.encrypted_contact_name = encrypt(
              contact.contact_name,
              encryptionKey,
            )
          if (contact.cell_phone)
            encryptedContact.encrypted_cell_phone = encrypt(
              contact.cell_phone,
              encryptionKey,
            )
          if (contact.work_phone)
            encryptedContact.encrypted_work_phone = encrypt(
              contact.work_phone,
              encryptionKey,
            )
          if (contact.home_phone)
            encryptedContact.encrypted_home_phone = encrypt(
              contact.home_phone,
              encryptionKey,
            )
          if (contact.relationship)
            encryptedContact.encrypted_relationship = encrypt(
              contact.relationship,
              encryptionKey,
            )
          return EncryptedEmergencyContactSchema.parse(encryptedContact)
        },
      )
    }

    return EncryptedResidentSchema.parse(encryptedData)
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Resident {
    const data = snapshot.data()
    const decryptedData: any = { ...data }

    // Decrypt and map fields
    if (data.encrypted_resident_name) {
      decryptedData.resident_name = decrypt(
        data.encrypted_resident_name,
        encryptionKey,
      )
      delete decryptedData.encrypted_resident_name
    }

    if (data.emergencyContacts && Array.isArray(data.emergencyContacts)) {
      decryptedData.emergencyContacts = data.emergencyContacts.map(
        (contact: any) => {
          const decryptedContact: any = {}
          if (contact.encrypted_contact_name)
            decryptedContact.contact_name = decrypt(
              contact.encrypted_contact_name,
              encryptionKey,
            )
          if (contact.encrypted_cell_phone)
            decryptedContact.cell_phone = decrypt(
              contact.encrypted_cell_phone,
              encryptionKey,
            )
          if (contact.encrypted_work_phone)
            decryptedContact.work_phone = decrypt(
              contact.encrypted_work_phone,
              encryptionKey,
            )
          if (contact.encrypted_home_phone)
            decryptedContact.home_phone = decrypt(
              contact.encrypted_home_phone,
              encryptionKey,
            )
          if (contact.encrypted_relationship)
            decryptedContact.relationship = decrypt(
              contact.encrypted_relationship,
              encryptionKey,
            )
          return EmergencyContactSchema.parse(decryptedContact)
        },
      )
    }

    return ResidentSchema.parse(decryptedData)
  },
})

export const facilityConverter: FirestoreDataConverter<Facility> = {
  toFirestore(contact: Facility): DocumentData {
    return FacilitySchema.parse(contact)
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Facility {
    return FacilitySchema.parse(snapshot.data())
  },
}
