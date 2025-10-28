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
  EncryptedFinancialTransactionSchema,
  EncryptedEmergencyContactSchema,
  SubCollectionMapType,
} from '@/types'
import {
  decryptResidentData,
  getFacilityConverter,
  getResidentConverter,
  getFinancialsConverter,
  getEmergencyContactsConverter,
  decryptFinancialTransaction,
  decryptEmergencyContact,
} from '@/types/converters'
import { notFound } from 'next/navigation'
import z from 'zod'
import { Query } from 'firebase-admin/firestore'

const subCollectionMap = {
  financials: {
    converter: getFinancialsConverter,
    decryptor: decryptFinancialTransaction,
  },
  emergency_contacts: {
    converter: getEmergencyContactsConverter,
    decryptor: decryptEmergencyContact,
  },
  // ... add other subcollections here as they get their own converters
} as const

type SubCollectionKey = keyof typeof subCollectionMap

export async function getNestedResidentData<K extends SubCollectionKey>(
  residentId: string,
  collectionName: K,
) {
  await verifySession() // Authenticate the request first

  const { converter, decryptor } = subCollectionMap[collectionName] as Omit<
    SubCollectionMapType[K],
    'type'
  >
  const subcollectionRef = (
    await collectionWrapper<SubCollectionMapType[K]['type']>(
      `providers/GYRHOME/residents/${residentId}/${collectionName}`,
    )
  ).withConverter(await converter())

  const snapshot = await getDocsWrapper(subcollectionRef)
  if (snapshot.empty) return
  const encryptedDocs = snapshot.docs.map((doc) => doc.data())

  // Decrypt each document in parallel
  const decryptedDocs = await Promise.all(
    encryptedDocs.map((doc) => decryptor(doc as any)), // Cast needed here
  )

  return decryptedDocs
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

    const resident = await decryptResidentData(residentSnap.data()!, userRoles)

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
    })
  } catch (error: any) {
    console.error(error)
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
        await docWrapper(residentsCollection, nextCursorId),
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
