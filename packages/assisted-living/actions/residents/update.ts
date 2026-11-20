'use server'
import {
  collectionWrapper,
  docWrapper,
  updateDocWrapper,
  getDocWrapper,
} from '#root/firebase/admin'
import {
  Resident,
  ResidentSchema,
} from '#root/types/schemas/administrative/resident'
import { EncryptedResidentSchema } from '#root/types/encrypted-schemas'
import { verifySession } from '#root/auth/server/definitions'
import { canAccessKekType } from '#root/lib/access-control'
import { getResidentConverter } from '#root/types/converters/residents/main'
import {
  decryptDataKey,
  encryptData,
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'
import { z } from 'zod'

export async function updateResident(
  newResidentData: Partial<Resident>,
  documentId: string,
) {
  try {
    const { provider_id, roles = [] } = await verifySession() // Authenticate the request first

    if (
      newResidentData.pcp !== undefined &&
      !canAccessKekType(roles, 'clinical')
    ) {
      return {
        success: false,
        message: 'Insufficient permissions to modify clinical data.',
      }
    }

    const contactFields: (keyof Resident)[] = [
      'dob',
      'resident_email',
      'cell_phone',
      'work_phone',
      'home_phone',
    ]
    if (
      contactFields.some((field) => newResidentData[field] !== undefined) &&
      !canAccessKekType(roles, 'contact')
    ) {
      return {
        success: false,
        message: 'Insufficient permissions to modify contact data.',
      }
    }

    const input = ResidentSchema.partial().parse(newResidentData)

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
    ).withConverter(await getResidentConverter())

    const residentDocRef = await docWrapper(residentsCollection, documentId)

    const existing = (await getDocWrapper(residentDocRef)).data()
    if (!existing) throw new Error('Resident not found')
    const encryptedResident: Record<string, any> = {}
    const groups = [
      {
        fields: ['resident_name', 'room_no', 'gender', 'avatar_url'],
        key: existing.encrypted_dek_general,
        path: KEK_GENERAL_PATH,
      },
      {
        fields: contactFields,
        key: existing.encrypted_dek_contact,
        path: KEK_CONTACT_PATH,
      },
      {
        fields: ['pcp'],
        key: existing.encrypted_dek_clinical,
        path: KEK_CLINICAL_PATH,
      },
    ]
    for (const group of groups) {
      const fields = group.fields.filter(
        (field) => input[field as keyof Resident] !== undefined,
      )
      if (!fields.length) continue
      const dek = await decryptDataKey(
        Buffer.from(group.key, 'base64'),
        group.path,
      )
      for (const field of fields) {
        const value = input[field as keyof Resident]
        encryptedResident['encrypted_' + field] =
          value === null ? null : encryptData(String(value), dek)
      }
    }
    for (const field of [
      'facility_id',
      'created_at',
      'deactivated_at',
    ] as const) {
      if (input[field] !== undefined) encryptedResident[field] = input[field]
    }
    await updateDocWrapper(residentDocRef, encryptedResident)

    return {
      success: true,
      message: 'Successfully Updated Resident Information',
    }
  } catch (error: any) {
    console.error('Failed to Update the Resident:', error)
    return {
      success: false,
      message: error.message || 'Failed to Update the Resident',
    }
  }
}
