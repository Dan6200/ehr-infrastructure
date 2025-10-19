'use server'
import {
  generateDataKey,
  decryptDataKey,
  encryptData,
  decryptData,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH, // Import new KEK path
} from '@/lib/encryption'

import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  Allergy,
  EmergencyContactSchema,
  EncryptedAllergySchema,
  EncryptedEmergencyContactSchema,
  EncryptedFinancialTransactionSchema,
  EncryptedMedicationSchema,
  EncryptedResident,
  EncryptedResidentSchema,
  Facility,
  FacilitySchema,
  FinancialTransaction,
  LegalRelationshipEnum,
  Medication,
  PersonalRelationshipEnum,
  Resident,
  ResidentSchema,
} from '.'

// --- Converters ---
const facilityConverter: FirestoreDataConverter<Facility> = {
  toFirestore(facility: Facility): DocumentData {
    return FacilitySchema.parse(facility)
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Facility {
    return FacilitySchema.parse(snapshot.data())
  },
}

export async function encryptResident(
  resident: Resident,
): Promise<EncryptedResident> {
  const dataToEncrypt: any = { ...resident }
  const encryptedData: any = {}

  encryptedData.facility_id = dataToEncrypt.facility_id
  encryptedData.room_no = dataToEncrypt.room_no

  const { plaintextDek: generalDek, encryptedDek: encryptedDekGeneral } =
    await generateDataKey(KEK_GENERAL_PATH)
  const { plaintextDek: contactDek, encryptedDek: encryptedDekContact } =
    await generateDataKey(KEK_CONTACT_PATH)
  const { plaintextDek: clinicalDek, encryptedDek: encryptedDekClinical } =
    await generateDataKey(KEK_CLINICAL_PATH)
  const { plaintextDek: financialDek, encryptedDek: encryptedDekFinancial } =
    await generateDataKey(KEK_FINANCIAL_PATH)

  encryptedData.encrypted_dek_general = encryptedDekGeneral.toString('base64')
  encryptedData.encrypted_dek_contact = encryptedDekContact.toString('base64')
  encryptedData.encrypted_dek_clinical = encryptedDekClinical.toString('base64')
  encryptedData.encrypted_dek_financial =
    encryptedDekFinancial.toString('base64')

  // Encrypt General Data
  if (dataToEncrypt.resident_name) {
    encryptedData.encrypted_resident_name = encryptData(
      dataToEncrypt.resident_name,
      generalDek,
    )
  }
  if (dataToEncrypt.avatar_url) {
    encryptedData.encrypted_avatar_url = encryptData(
      dataToEncrypt.avatar_url,
      generalDek,
    )
  }

  // Encrypt Contact Data
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
  if (dataToEncrypt.emergency_contacts) {
    encryptedData.emergency_contacts = await Promise.all(
      dataToEncrypt.emergency_contacts.map(async (contact: any) => {
        const encryptedContact: any = {}
        if (contact.contact_name) {
          encryptedContact.encrypted_contact_name = encryptData(
            contact.contact_name,
            contactDek,
          )
        }
        if (contact.cell_phone) {
          encryptedContact.encrypted_cell_phone = encryptData(
            contact.cell_phone,
            contactDek,
          )
        }
        if (contact.work_phone) {
          encryptedContact.encrypted_work_phone = encryptData(
            contact.work_phone,
            contactDek,
          )
        }
        if (contact.home_phone) {
          encryptedContact.encrypted_home_phone = encryptData(
            contact.home_phone,
            contactDek,
          )
        }
        if (contact.relationship) {
          encryptedContact.encrypted_relationship = contact.relationship.map(
            (r: string) => encryptData(r, contactDek),
          )
        }
        return EncryptedEmergencyContactSchema.parse(encryptedContact)
      }),
    )
  }

  // Encrypt Clinical Data
  if (dataToEncrypt.pcp) {
    encryptedData.encrypted_pcp = encryptData(dataToEncrypt.pcp, clinicalDek)
  }
  if (dataToEncrypt.allergies) {
    encryptedData.encrypted_allergies = dataToEncrypt.allergies.map(
      (allergy: Allergy) => {
        const enc: any = {}
        if (allergy.name)
          enc.encrypted_name = encryptData(allergy.name, clinicalDek)
        if (allergy.snomed_code)
          enc.encrypted_snomed_code = encryptData(
            allergy.snomed_code,
            clinicalDek,
          )
        if (allergy.reaction)
          enc.encrypted_reaction = encryptData(allergy.reaction, clinicalDek)
        return EncryptedAllergySchema.parse(enc)
      },
    )
  }
  if (dataToEncrypt.medications) {
    encryptedData.encrypted_medications = dataToEncrypt.medications.map(
      (med: Medication) => {
        const enc: any = {}
        if (med.name) enc.encrypted_name = encryptData(med.name, clinicalDek)
        if (med.rxnorm_code)
          enc.encrypted_rxnorm_code = encryptData(med.rxnorm_code, clinicalDek)
        if (med.dosage)
          enc.encrypted_dosage = encryptData(med.dosage, clinicalDek)
        if (med.frequency)
          enc.encrypted_frequency = encryptData(med.frequency, clinicalDek)
        return EncryptedMedicationSchema.parse(enc)
      },
    )
  }
  if (dataToEncrypt.medical_records) {
    encryptedData.encrypted_medical_records = dataToEncrypt.medical_records.map(
      (record: MedicalRecord) => {
        const enc: any = {}
        if (record.date)
          enc.encrypted_date = encryptData(record.date, clinicalDek)
        if (record.title)
          enc.encrypted_title = encryptData(record.title, clinicalDek)
        if (record.notes)
          enc.encrypted_notes = encryptData(record.notes, clinicalDek)
        if (record.snomed_code)
          enc.encrypted_snomed_code = encryptData(
            record.snomed_code,
            clinicalDek,
          )
        return EncryptedMedicalRecordSchema.parse(enc)
      },
    )
  }
  if (dataToEncrypt.vitals) {
    encryptedData.encrypted_vitals = dataToEncrypt.vitals.map(
      (vital: Vital) => {
        const enc: any = {}
        if (vital.date)
          enc.encrypted_date = encryptData(vital.date, clinicalDek)
        if (vital.loinc_code)
          enc.encrypted_loinc_code = encryptData(vital.loinc_code, clinicalDek)
        if (vital.value)
          enc.encrypted_value = encryptData(vital.value, clinicalDek)
        if (vital.unit)
          enc.encrypted_unit = encryptData(vital.unit, clinicalDek)
        return EncryptedVitalSchema.parse(enc)
      },
    )
  }

  // Encrypt Financial Data
  if (dataToEncrypt.financials) {
    encryptedData.encrypted_financials = dataToEncrypt.financials.map(
      (item: FinancialTransaction) => {
        const enc: any = {}
        if (item.amount)
          enc.encrypted_amount = encryptData(
            item.amount.toString(),
            financialDek,
          )
        if (item.date) enc.encrypted_date = encryptData(item.date, financialDek)
        if (item.type) enc.encrypted_type = encryptData(item.type, financialDek)
        if (item.description)
          enc.encrypted_description = encryptData(
            item.description,
            financialDek,
          )
        return EncryptedFinancialTransactionSchema.parse(enc)
      },
    )
  }

  return EncryptedResidentSchema.parse(encryptedData)
}

export async function decryptResidentData(
  data: EncryptedResident,
  roles: string[],
): Promise<Resident> {
  const decryptedData: Partial<Resident> = {}
  decryptedData.facility_id = data.facility_id
  decryptedData.room_no = data.room_no

  let generalDek: Buffer | undefined
  let contactDek: Buffer | undefined
  let clinicalDek: Buffer | undefined
  let financialDek: Buffer | undefined

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
          KEK_GENERAL_PATH,
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
          KEK_CONTACT_PATH,
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
          KEK_CLINICAL_PATH,
        )
      } catch (e) {
        console.error('Failed to decrypt clinical DEK:', e)
      }
    }
  }

  if (userRoles.includes('ADMIN') || userRoles.includes('BILLING')) {
    if (data.encrypted_dek_financial) {
      try {
        financialDek = await decryptDataKey(
          Buffer.from(data.encrypted_dek_financial, 'base64'),
          KEK_FINANCIAL_PATH,
        )
      } catch (e) {
        console.error('Failed to decrypt financial DEK:', e)
      }
    }
  }

  if (generalDek) {
    if (data.encrypted_resident_name)
      decryptedData.resident_name = decryptData(
        data.encrypted_resident_name,
        generalDek,
      )
    if (data.encrypted_avatar_url)
      decryptedData.avatar_url = decryptData(
        data.encrypted_avatar_url,
        generalDek,
      )
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
    if (data.emergency_contacts) {
      decryptedData.emergency_contacts = data.emergency_contacts.map(
        (contact) => {
          const dec: any = {}
          if (contact.encrypted_contact_name)
            dec.contact_name = decryptData(
              contact.encrypted_contact_name,
              contactDek,
            )
          if (contact.encrypted_cell_phone)
            dec.cell_phone = decryptData(
              contact.encrypted_cell_phone,
              contactDek,
            )
          if (contact.encrypted_work_phone)
            dec.work_phone = decryptData(
              contact.encrypted_work_phone,
              contactDek,
            )
          if (contact.encrypted_home_phone)
            dec.home_phone = decryptData(
              contact.encrypted_home_phone,
              contactDek,
            )
          if (contact.encrypted_relationship) {
            const decryptedRelationships = contact.encrypted_relationship
              .map((r) => decryptData(r, contactDek))
              .filter(Boolean)
            dec.legal_relationships = decryptedRelationships.filter(
              (r: any) => LegalRelationshipEnum.safeParse(r).success,
            )
            dec.personal_relationships = decryptedRelationships.filter(
              (r: any) => PersonalRelationshipEnum.safeParse(r).success,
            )
          }
          return EmergencyContactSchema.parse(dec)
        },
      )
    }
  }

  if (clinicalDek) {
    if (data.encrypted_pcp)
      decryptedData.pcp = decryptData(data.encrypted_pcp, clinicalDek)
    if (data.encrypted_allergies) {
      decryptedData.allergies = data.encrypted_allergies.map((allergy) => {
        const dec: any = {}
        if (allergy.encrypted_name)
          dec.name = decryptData(allergy.encrypted_name, clinicalDek)
        if (allergy.encrypted_snomed_code)
          dec.snomed_code = decryptData(
            allergy.encrypted_snomed_code,
            clinicalDek,
          )
        if (allergy.encrypted_reaction)
          dec.reaction = decryptData(allergy.encrypted_reaction, clinicalDek)
        return dec
      })
    }
    if (data.encrypted_medications) {
      decryptedData.medications = data.encrypted_medications.map((med) => {
        const dec: any = {}
        if (med.encrypted_name)
          dec.name = decryptData(med.encrypted_name, clinicalDek)
        if (med.encrypted_rxnorm_code)
          dec.rxnorm_code = decryptData(med.encrypted_rxnorm_code, clinicalDek)
        if (med.encrypted_dosage)
          dec.dosage = decryptData(med.encrypted_dosage, clinicalDek)
        if (med.encrypted_frequency)
          dec.frequency = decryptData(med.encrypted_frequency, clinicalDek)
        return dec
      })
    }
    if (data.encrypted_medical_records) {
      decryptedData.medical_records = data.encrypted_medical_records.map(
        (record: any) => {
          const dec: any = {}
          if (record.encrypted_date)
            dec.date = decryptData(record.encrypted_date, clinicalDek)
          if (record.encrypted_title)
            dec.title = decryptData(record.encrypted_title, clinicalDek)
          if (record.encrypted_notes)
            dec.notes = decryptData(record.encrypted_notes, clinicalDek)
          if (record.encrypted_snomed_code)
            dec.snomed_code = decryptData(
              record.encrypted_snomed_code,
              clinicalDek,
            )
          return dec
        },
      )
    }
    if (data.encrypted_vitals) {
      decryptedData.vitals = data.encrypted_vitals.map((vital: any) => {
        const dec: any = {}
        if (vital.encrypted_date)
          dec.date = decryptData(vital.encrypted_date, clinicalDek)
        if (vital.encrypted_loinc_code)
          dec.loinc_code = decryptData(vital.encrypted_loinc_code, clinicalDek)
        if (vital.encrypted_value)
          dec.value = decryptData(vital.encrypted_value, clinicalDek)
        if (vital.encrypted_unit)
          dec.unit = decryptData(vital.encrypted_unit, clinicalDek)
        return dec
      })
    }
  }

  if (financialDek && data.encrypted_financials) {
    decryptedData.financials = data.encrypted_financials.map((item) => {
      const dec: any = {}
      if (item.encrypted_amount)
        dec.amount = parseFloat(
          decryptData(item.encrypted_amount, financialDek),
        )
      if (item.encrypted_date)
        dec.date = decryptData(item.encrypted_date, financialDek)
      if (item.encrypted_type)
        dec.type = decryptData(item.encrypted_type, financialDek)
      if (item.encrypted_description)
        dec.description = decryptData(item.encrypted_description, financialDek)
      return dec
    })
  }

  return ResidentSchema.parse(decryptedData)
}

export const getResidentConverter = async (): Promise<
  FirestoreDataConverter<EncryptedResident, Resident>
> => ({
  toFirestore(resident: unknown): Resident {
    // This is now synchronous and will not encrypt the data.
    // Encryption must be handled by calling `encryptResident` before `toFirestore`.
    return ResidentSchema.parse(resident)
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
  ): EncryptedResident {
    // This is now synchronous and will not decrypt the data.
    // Encryption must be handled by calling `decryptResident` before `fromFirestore`.
    const data = snapshot.data()
    return EncryptedResidentSchema.parse(data)
  },
})

export const getFacilityConverter = async function () {
  return facilityConverter
}
