'use server'

import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import {
  collectionWrapper,
  docWrapper,
  getDocWrapper,
  getDocsWrapper,
  queryWrapper,
} from '@/firebase/firestore-server'
import {
  EncryptedResident,
  Facility,
  FacilitySchema,
  Resident,
  ResidentDataSchema,
  ResidentSchema,
} from '@/types'
import {
  decryptResidentData,
  getFacilityConverter,
  getResidentConverter,
} from '@/types/converters'
import {
  QueryConstraint,
  endBefore,
  limit as limitQuery,
  limitToLast,
  orderBy,
  startAfter,
} from 'firebase/firestore'
import { notFound } from 'next/navigation'
import { z } from 'zod'

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentDataSchema>> {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentsColRef = (
      await collectionWrapper<EncryptedResident>(
        app,
        'providers/GYRHOME/residents',
      )
    ).withConverter(await getResidentConverter())
    const residentDocRef = await docWrapper(residentsColRef, documentId)
    const residentSnap = await getDocWrapper(residentDocRef)

    if (!residentSnap.exists()) throw notFound()

    const resident = await decryptResidentData(residentSnap.data(), userRoles)

    const validatedResident = ResidentSchema.parse(resident)

    const facilitiesColRef = (
      await collectionWrapper<Facility>(app, 'providers/GYRHOME/facilities')
    ).withConverter(await getFacilityConverter())
    const facilityDocRef = await docWrapper(
      facilitiesColRef,
      validatedResident.facility_id,
    )
    const facilitySnap = await getDocWrapper(facilityDocRef)

    if (!facilitySnap.exists()) {
      throw new Error('Could not find linked facility for this resident')
    }
    const { address } = facilitySnap.data()

    return { ...validatedResident, id: residentSnap.id, address }
  } catch (error: any) {
    throw new Error(`Failed to fetch resident: ${error.message}`)
  }
}

export async function getResidents(): Promise<Resident[]> {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken.claims?.roles as string[]) || []

    const residentsCollection = (
      await collectionWrapper<EncryptedResident>(app, 'residents')
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
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app } = authenticatedApp

    const facilitiesCollection = (
      await collectionWrapper<Facility>(app, 'providers/GYRHOME/facilities')
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

export async function getAllResidentsData({
  limit = 100,
  nextCursorId,
  prevCursorId,
}: {
  limit?: number
  nextCursorId?: string
  prevCursorId?: string
}) {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentsCollection = (
      await collectionWrapper<EncryptedResident>(
        app,
        `providers/GYRHOME/residents`,
      )
    ).withConverter(await getResidentConverter())

    const constraints: QueryConstraint[] = [
      orderBy('facility_id'),
      orderBy('encrypted_resident_name'),
    ]
    let isPrev = false

    if (nextCursorId) {
      const cursorDocRef = await docWrapper(residentsCollection, nextCursorId)
      const cursorDoc = await getDocWrapper(cursorDocRef)
      if (cursorDoc.exists()) {
        constraints.push(startAfter(cursorDoc))
      }
    } else if (prevCursorId) {
      isPrev = true
      const cursorDocRef = await docWrapper(residentsCollection, prevCursorId)
      const cursorDoc = await getDocWrapper(cursorDocRef)
      if (cursorDoc.exists()) {
        constraints.push(endBefore(cursorDoc))
        constraints.push(limitToLast(limit + 1)) // Fetch one extra to check for previous page
      }
    }

    if (!isPrev) {
      constraints.push(limitQuery(limit + 1)) // Fetch one extra to check for next page
    }

    const collectionQuery = await queryWrapper(
      residentsCollection,
      ...constraints,
    )
    const residentsSnapshot = await getDocsWrapper(collectionQuery)

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

    const nextCursor = hasNextPage
      ? residentsForPage[residentsForPage.length - 1]?.id
      : undefined
    const prevCursor = hasPrevPage ? residentsForPage[0]?.id : undefined

    const facilitiesCollection = (
      await collectionWrapper<Facility>(app, 'providers/GYRHOME/facilities')
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
    throw new Error(`Failed to fetch all residents data: ${error.message}`)
  }
}
