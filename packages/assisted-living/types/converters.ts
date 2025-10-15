'use server'
import {
  generateDataKey,
  decryptDataKey,
  encryptData,
  decryptData,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
} from '@/lib/encryption'

import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  EmergencyContactSchema,
  EncryptedEmergencyContactSchema,
  EncryptedResident,
  EncryptedResidentSchema,
  Facility,
  FacilitySchema,
  Resident,
  ResidentSchema,
} from '.'

// --- Converters ---
// Synchronous converter for Facility data
const facilityConverter: FirestoreDataConverter<Facility> = {
  toFirestore(facility: Facility): DocumentData {
    return FacilitySchema.parse(facility)
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Facility {
    return FacilitySchema.parse(snapshot.data())
  },
}

// Asynchronous function to encrypt a Resident object
export async function encryptResident(
  resident: Resident,
): Promise<EncryptedResident> {
  const dataToEncrypt: any = { ...resident }
  const encryptedData: any = {}

  // Unencrypted fields
  encryptedData.facility_id = dataToEncrypt.facility_id
  encryptedData.room_no = dataToEncrypt.room_no

  // Generate DEKs and encrypt them
  const { plaintextDek: generalDek, encryptedDek: encryptedDekGeneral } =
    await generateDataKey(KEK_GENERAL_PATH)
  const { plaintextDek: contactDek, encryptedDek: encryptedDekContact } =
    await generateDataKey(KEK_CONTACT_PATH)
  const { plaintextDek: clinicalDek, encryptedDek: encryptedDekClinical } =
    await generateDataKey(KEK_CLINICAL_PATH)

  encryptedData.encrypted_dek_general = encryptedDekGeneral.toString('base64')
  encryptedData.encrypted_dek_contact = encryptedDekContact.toString('base64')
  encryptedData.encrypted_dek_clinical = encryptedDekClinical.toString('base64')

  // Encrypt General Data
  if (dataToEncrypt.resident_name) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.resident_name,
      generalDek,
    )
    encryptedData.encrypted_resident_name = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (dataToEncrypt.avatar_url) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.avatar_url,
      generalDek,
    )
    encryptedData.encrypted_avatar_url = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }

  // Encrypt Contact Data
  if (dataToEncrypt.resident_email) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.resident_email,
      contactDek,
    )
    encryptedData.encrypted_resident_email = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (dataToEncrypt.cell_phone) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.cell_phone,
      contactDek,
    )
    encryptedData.encrypted_cell_phone = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (dataToEncrypt.work_phone) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.work_phone,
      contactDek,
    )
    encryptedData.encrypted_work_phone = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (dataToEncrypt.home_phone) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.home_phone,
      contactDek,
    )
    encryptedData.encrypted_home_phone = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (dataToEncrypt.dob) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.dob,
      contactDek,
    )
    encryptedData.encrypted_dob = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }
  if (dataToEncrypt.emergency_contacts) {
    encryptedData.emergency_contacts = await Promise.all(
      dataToEncrypt.emergency_contacts.map(async (contact: any) => {
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
        if (contact.relationship) {
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
        return EncryptedEmergencyContactSchema.parse(encryptedContact)
      }),
    )
  }

  // Encrypt Clinical Data
  if (dataToEncrypt.pcp) {
    const { ciphertext, iv, authTag } = encryptData(
      dataToEncrypt.pcp,
      clinicalDek,
    )
    encryptedData.encrypted_pcp = {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    }
  }

  return EncryptedResidentSchema.parse(encryptedData)
}

// Asynchronous function to decrypt a Resident object based on user roles
export async function decryptResidentData(
  data: EncryptedResident,
  roles: string[],
): Promise<Resident> {
  // Unencrypted fields
  const decryptedData: Resident = {} as Resident
  decryptedData.facility_id = data.facility_id
  decryptedData.room_no = data.room_no

  // Decrypt DEKs based on user roles
  let generalDek: Buffer | string | Uint8Array | undefined
  let contactDek: Buffer | string | Uint8Array | undefined
  let clinicalDek: Buffer | string | Uint8Array | undefined

  // convert to uppercase if not...
  const userRoles = roles.map((role) => role.toUpperCase())

  // Role-based DEK decryption
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

  // Decrypt General Data
  if (generalDek && data.encrypted_resident_name) {
    try {
      decryptedData.resident_name = decryptData(
        {
          ciphertext: Buffer.from(
            data.encrypted_resident_name.ciphertext,
            'base64',
          ),
          iv: Buffer.from(data.encrypted_resident_name.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_resident_name.authTag, 'base64'),
        },
        generalDek,
      )
    } catch (e) {
      console.error('Failed to decrypt resident_name:', e)
    }
  }
  if (generalDek && data.encrypted_avatar_url) {
    try {
      decryptedData.avatar_url = decryptData(
        {
          ciphertext: Buffer.from(
            data.encrypted_avatar_url.ciphertext,
            'base64',
          ),
          iv: Buffer.from(data.encrypted_avatar_url.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_avatar_url.authTag, 'base64'),
        },
        generalDek,
      )
    } catch (e) {
      console.error('Failed to decrypt avatar_url:', e)
    }
  }

  // Decrypt Contact Data
  if (contactDek && data.encrypted_resident_email) {
    try {
      decryptedData.resident_email = decryptData(
        {
          ciphertext: Buffer.from(
            data.encrypted_resident_email.ciphertext,
            'base64',
          ),
          iv: Buffer.from(data.encrypted_resident_email.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_resident_email.authTag, 'base64'),
        },
        contactDek,
      )
    } catch (e) {
      console.error('Failed to decrypt resident_email:', e)
    }
  }
  if (contactDek && data.encrypted_cell_phone) {
    try {
      decryptedData.cell_phone = decryptData(
        {
          ciphertext: Buffer.from(
            data.encrypted_cell_phone.ciphertext,
            'base64',
          ),
          iv: Buffer.from(data.encrypted_cell_phone.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_cell_phone.authTag, 'base64'),
        },
        contactDek,
      )
    } catch (e) {
      console.error('Failed to decrypt cell_phone:', e)
    }
  }
  if (contactDek && data.encrypted_work_phone) {
    try {
      decryptedData.work_phone = decryptData(
        {
          ciphertext: Buffer.from(
            data.encrypted_work_phone.ciphertext,
            'base64',
          ),
          iv: Buffer.from(data.encrypted_work_phone.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_work_phone.authTag, 'base64'),
        },
        contactDek,
      )
    } catch (e) {
      console.error('Failed to decrypt work_phone:', e)
    }
  }
  if (contactDek && data.encrypted_home_phone) {
    try {
      decryptedData.home_phone = decryptData(
        {
          ciphertext: Buffer.from(
            data.encrypted_home_phone.ciphertext,
            'base64',
          ),
          iv: Buffer.from(data.encrypted_home_phone.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_home_phone.authTag, 'base64'),
        },
        contactDek,
      )
    } catch (e) {
      console.error('Failed to decrypt home_phone:', e)
    }
  }

  if (contactDek && data.encrypted_dob) {
    try {
      decryptedData.dob = decryptData(
        {
          ciphertext: Buffer.from(data.encrypted_dob.ciphertext, 'base64'),
          iv: Buffer.from(data.encrypted_dob.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_dob.authTag, 'base64'),
        },
        contactDek,
      )
    } catch (e) {
      console.error('Failed to decrypt dob:', e)
    }
  }
  if (
    contactDek &&
    data.emergency_contacts &&
    Array.isArray(data.emergency_contacts)
  ) {
    decryptedData.emergency_contacts = data.emergency_contacts.map(
      (contact: any) => {
        const decryptedContact: any = {}
        if (contact.encrypted_contact_name) {
          try {
            decryptedContact.contact_name = decryptData(
              {
                ciphertext: Buffer.from(
                  contact.encrypted_contact_name.ciphertext,
                  'base64',
                ),
                iv: Buffer.from(contact.encrypted_contact_name.iv, 'base64'),
                authTag: Buffer.from(
                  contact.encrypted_contact_name.authTag,
                  'base64',
                ),
              },
              contactDek,
            )
          } catch (e) {
            console.error('Failed to decrypt contact_name:', e)
          }
        }
        if (contact.encrypted_cell_phone) {
          try {
            decryptedContact.cell_phone = decryptData(
              {
                ciphertext: Buffer.from(
                  contact.encrypted_cell_phone.ciphertext,
                  'base64',
                ),
                iv: Buffer.from(contact.encrypted_cell_phone.iv, 'base64'),
                authTag: Buffer.from(
                  contact.encrypted_cell_phone.authTag,
                  'base64',
                ),
              },
              contactDek,
            )
          } catch (e) {
            console.error('Failed to decrypt cell_phone:', e)
          }
        }
        if (contact.encrypted_work_phone) {
          try {
            decryptedContact.work_phone = decryptData(
              {
                ciphertext: Buffer.from(
                  contact.encrypted_work_phone.ciphertext,
                  'base64',
                ),
                iv: Buffer.from(contact.encrypted_work_phone.iv, 'base64'),
                authTag: Buffer.from(
                  contact.encrypted_work_phone.authTag,
                  'base64',
                ),
              },
              contactDek,
            )
          } catch (e) {
            console.error('Failed to decrypt work_phone:', e)
          }
        }
        if (contact.encrypted_home_phone) {
          try {
            decryptedContact.home_phone = decryptData(
              {
                ciphertext: Buffer.from(
                  contact.encrypted_home_phone.ciphertext,
                  'base64',
                ),
                iv: Buffer.from(contact.encrypted_home_phone.iv, 'base64'),
                authTag: Buffer.from(
                  contact.encrypted_home_phone.authTag,
                  'base64',
                ),
              },
              contactDek,
            )
          } catch (e) {
            console.error('Failed to decrypt home_phone:', e)
          }
        }
        if (contact.encrypted_relationship) {
          decryptedContact.relationship = contact.encrypted_relationship
            .map((r: any) => {
              try {
                return decryptData(
                  {
                    ciphertext: Buffer.from(r.ciphertext, 'base64'),
                    iv: Buffer.from(r.iv, 'base64'),
                    authTag: Buffer.from(r.authTag, 'base64'),
                  },
                  contactDek,
                )
              } catch (e) {
                console.error('Failed to decrypt relationship item:', e)
                return undefined // Or handle as appropriate
              }
            })
            .filter(Boolean) // Remove undefined entries
        }
        return EmergencyContactSchema.parse(decryptedContact)
      },
    )
  }

  // Decrypt Clinical Data
  if (clinicalDek && data.encrypted_pcp) {
    try {
      decryptedData.pcp = decryptData(
        {
          ciphertext: Buffer.from(data.encrypted_pcp.ciphertext, 'base64'),
          iv: Buffer.from(data.encrypted_pcp.iv, 'base64'),
          authTag: Buffer.from(data.encrypted_pcp.authTag, 'base64'),
        },
        clinicalDek,
      )
    } catch (e) {
      console.error('Failed to decrypt pcp:', e)
    }
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
