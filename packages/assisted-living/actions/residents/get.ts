'use server'

import { verifySession } from '@/auth/server/definitions'
import {
  collectionWrapper,
  docWrapper,
  getDocWrapper,
  getDocsWrapper,
} from '@/firebase/admin'
import {
  Facility,
  FacilitySchema,
  Resident,
  ResidentDataSchema,
  ResidentSchema,
  AllergySchema,
  PrescriptionSchema,
  ObservationSchema,
  DiagnosticHistorySchema,
  EmergencyContactSchema,
  FinancialTransactionSchema,
  EmarRecordSchema,
  EncryptedResidentSchema,
} from '@/types'
import {
  decryptResidentData,
  getFacilityConverter,
  getResidentConverter,
} from '@/types/converters'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { decryptData, decryptDataKey } from '@/lib/encryption'

// --- Subcollection Getters ---
async function getSubcollection<T extends z.ZodTypeAny>(
  residentId: string,
  collectionName: string,
  schema: T,
  kekPath: string,
): Promise<z.infer<T>[]> {
  await verifySession() // Authenticate the request first

  const subcollectionRef = collectionWrapper(
    `providers/GYRHOME/residents/${residentId}/${collectionName}`,
  )
  const snapshot = await getDocsWrapper(subcollectionRef)

  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const encryptedData = doc.data()

      // Decrypt the document-specific DEK
      const dek = await decryptDataKey(
        Buffer.from(encryptedData.encrypted_dek, 'base64'),
        kekPath,
      )

      const decryptedData: { [key: string]: any } = {
        id: doc.id,
        resident_id: encryptedData.resident_id,
      }
      for (const key in encryptedData) {
        if (key.startsWith('encrypted_') && key !== 'encrypted_dek') {
          const newKey = key.replace('encrypted_', '')
          decryptedData[newKey] = decryptData(encryptedData[key], dek)
        }
      }
      // Special handling for financial amounts which are numbers
      if (collectionName === 'financials' && decryptedData.amount) {
        decryptedData.amount = parseFloat(decryptedData.amount)
      }
      return schema.parse(decryptedData)
    }),
  )
}

import {
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
} from '@/lib/encryption'

const subCollectionMap = {
  allergies: [AllergySchema, KEK_CONTACT_PATH],
  prescriptions: [PrescriptionSchema, KEK_CLINICAL_PATH],
  observations: [ObservationSchema, KEK_CLINICAL_PATH],
  diagnostic_history: [DiagnosticHistorySchema, KEK_CLINICAL_PATH],
  emergency_contacts: [EmergencyContactSchema, KEK_CONTACT_PATH],
  financials: [FinancialTransactionSchema, KEK_FINANCIAL_PATH],
  emar: [EmarRecordSchema, KEK_CLINICAL_PATH],
} as const

type SubCollectionKey = keyof typeof subCollectionMap

export async function getNestedResidentData<K extends SubCollectionKey>(
  residentId: string,
  subCollectionName: K,
) {
  const [schema, kekPath] = subCollectionMap[subCollectionName]
  return getSubcollection(residentId, subCollectionName, schema, kekPath)
}

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentDataSchema>> {
  try {
    const idToken = await verifySession()
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/GYRHOME/residents`,
      )
    ).withConverter(await getResidentConverter())

    const residentRef = await docWrapper(residentsCollection, documentId)
    const residentSnap = await getDocWrapper(residentRef)

    if (!residentSnap.exists) throw notFound()

    const resident = await decryptResidentData(residentSnap.data(), userRoles)

    // Fetch and decrypt subcollections in parallel
    const [
      allergies,
      prescriptions,
      observations,
      diagnostic_history,
      emergency_contacts,
      financials,
      emar,
    ] = await Promise.all(
      Object.entries(subCollectionMap).map(([subcolName]) =>
        getNestedResidentData(documentId, subcolName as SubCollectionKey),
      ),
    )

    const facilitiesCollection = (
      await collectionWrapper<Facility>('providers/GYRHOME/facilities')
    ).withConverter(await getFacilityConverter())
    const facilityDocRef = await docWrapper(
      facilitiesCollection,
      resident.facility_id,
    )
    const facilitySnap = await getDocWrapper(facilityDocRef)
    const address = facilitySnap.exists
      ? facilitySnap.data()?.address
      : 'Address not found'

    return ResidentDataSchema.parse({
      ...resident,
      id: residentSnap.id,
      address,
      allergies,
      prescriptions,
      observations,
      diagnostic_history,
      emergency_contacts,
      financials,
      emar,
    })
  } catch (error: any) {
    throw new Error(`Failed to fetch resident: ${error.message}`)
  }
}

export async function getResidents(): Promise<Resident[]> {
  try {
    const idToken = await verifySession()
    const userRoles: string[] = (idToken.roles as string[]) || []

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        'providers/GYRHOME/residents',
      )
    ).withConverter(await getResidentConverter())
    const residentsSnap = await getDocsWrapper(residentsCollection)

    return Promise.all(
      residentsSnap.docs.map(async (doc) => {
        const resident = await decryptResidentData(doc.data(), userRoles)
        return ResidentSchema.parse(resident)
      }),
    )
  } catch (error: any) {
    throw new Error(`Failed to fetch all residents data: ${error.message}`)
  }
}

export async function getAllFacilities(): Promise<Facility[]> {
  try {
    await verifySession()

    const facilitiesCollection = (
      await collectionWrapper<Facility>('providers/GYRHOME/facilities')
    ).withConverter(await getFacilityConverter())
    const facilitiesSnap = await getDocsWrapper(facilitiesCollection)

    if (facilitiesSnap.empty) throw notFound()

    return facilitiesSnap.docs.map((doc) => {
      const facility = { id: doc.id, ...doc.data() }
      return FacilitySchema.parse(facility)
    })
  } catch (error: any) {
    throw new Error(`Failed to fetch all facilities: ${error.message}`)
  }
}

export async function getAllResidents({
  limit = 100,
  nextCursorId,
  prevCursorId,
}: {
  limit?: number
  nextCursorId?: string
  prevCursorId?: string
}) {
  try {
    const idToken = await verifySession()
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/GYRHOME/residents`,
      )
    ).withConverter(await getResidentConverter())

    let query: Query<z.infer<typeof EncryptedResidentSchema>> =
      residentsCollection
        .orderBy('facility_id')
        .orderBy('encrypted_resident_name')

    let isPrev = false

    if (nextCursorId) {
      const cursorDoc = await getDocWrapper(
        docWrapper(residentsCollection, nextCursorId),
      )
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    } else if (prevCursorId) {
      isPrev = true
      const cursorDoc = await getDocWrapper(
        await docWrapper(residentsCollection, prevCursorId),
      )
      if (cursorDoc.exists) {
        query = query.endBefore(cursorDoc).limitToLast(limit + 1)
      }
    }

    if (!isPrev) {
      query = query.limit(limit + 1)
    }

    const residentsSnapshot = await getDocsWrapper(query)

    let residentsForPage = await Promise.all(
      residentsSnapshot.docs.map(async (doc) => ({
        id: doc.id,
        ...(await decryptResidentData(doc.data() as any, userRoles)),
      })),
    )

    let hasNextPage = false
    let hasPrevPage = false

    if (isPrev) {
      hasPrevPage = residentsForPage.length > limit
      if (hasPrevPage) {
        residentsForPage.shift() // Remove the extra item from the beginning
      }
      hasNextPage = true
    } else {
      hasNextPage = residentsForPage.length > limit
      if (hasNextPage) {
        residentsForPage.pop() // Remove the extra item from the end
      }
      hasPrevPage = !!nextCursorId
    }

    const nextCursor =
      residentsForPage.length > 0 && hasNextPage
        ? residentsForPage[residentsForPage.length - 1]?.id
        : undefined
    const prevCursor =
      residentsForPage.length > 0 && hasPrevPage
        ? residentsForPage[0]?.id
        : undefined

    const facilitiesCollection = (
      await collectionWrapper<Facility>('providers/GYRHOME/facilities')
    ).withConverter(await getFacilityConverter())
    const facilitiesData = await getDocsWrapper(facilitiesCollection)
    const facility_lookup: { [id: string]: string } =
      facilitiesData.docs.reduce(
        (lookup: { [id: string]: any }, facility) => ({
          ...lookup,
          [facility.id]: facility.data().address,
        }),
        {},
      )

    const residentsWithAddress = residentsForPage.map((resident) => {
      const address =
        facility_lookup[resident.facility_id] || 'Address not found'
      return { ...resident, address }
    })

    return {
      residents: residentsWithAddress,
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage,
    }
  } catch (error: any) {
    console.error(error)
    throw new Error(`Failed to fetch all residents data: ${error.message}`)
  }
}
