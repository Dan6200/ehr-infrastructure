'use server'
import {
  collectionWrapper,
  getCount,
  queryWrapper,
  getDocsWrapper,
  limitQuery,
  startAfter,
} from '@/firebase/firestore-server'
import {
  Resident,
  Facility,
  ResidentSchema,
  FacilitySchema,
  ResidentDataSchema,
  facilityConverter,
  createResidentConverter,
} from '@/types'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import { DocumentReference } from 'firebase/firestore'

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentDataSchema>> {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentsColRef = collectionWrapper(
      app,
      'providers/GYRHOME/residents',
    ).withConverter(createResidentConverter(userRoles))
    const residentSnap = await residentsColRef.doc(documentId).get()
    if (!residentSnap.exists) throw notFound()
    const resident = residentSnap.data()
    let validatedResident: Resident
    try {
      validatedResident = ResidentSchema.parse(resident)
    } catch (error: any) {
      throw new Error(
        'Object is not of type Resident  -- Tag:16: ' + error.message,
      )
    }
    const facilitySnap = await collectionWrapper(
      app,
      'providers/GYRHOME/facilities',
    )
      .withConverter(facilityConverter)
      .doc(validatedResident.facility_id)
      .get()

    if (!facilitySnap.exists)
      throw new Error('Could not find linked facility for this resident')
    const { address } = facilitySnap.data()

    return { ...validatedResident, id: residentSnap.id, address }
  } catch (error: any) {
    throw new Error('Failed to fetch resident.\n\t\t' + error)
  }
}

export async function getResidents() {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken.claims?.roles as string[]) || []

    const residentsCollection = collectionWrapper(app, 'residents')
    const residentsSnap = await residentsCollection.get()
    return residentsSnap.docs.map((doc) => {
      const resident = doc.data()
      let validatedResident: Resident
      try {
        validatedResident = ResidentSchema.parse(resident)
      } catch (error: any) {
        throw new Error(
          'Object is not of type Resident  -- Tag:20: ' + error.message,
        )
      }
      return validatedResident
    })
  } catch (error) {
    throw new Error('Failed to fetch All Residents Data.\n\t\t' + error)
  }
}

export async function getAllFacilities() {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app } = authenticatedApp

    const facilitiesCollection = collectionWrapper(
      app,
      'providers/GYRHOME/facilities',
    )
    const facilitiesSnap = await facilitiesCollection.get()
    if (!facilitiesSnap.size) throw notFound()
    return facilitiesSnap.docs.map((doc) => {
      const facility = { document_id: doc.id, ...doc.data() }
      let validatedFacility: Facility
      try {
        validatedFacility = FacilitySchema.parse(facility)
      } catch (error: any) {
        throw new Error(
          'Object is not of type Facility  -- Tag:19: ' + error.message,
        )
      }
      return validatedFacility
    })
  } catch (error) {
    throw new Error('Failed to fetch All Facilities.\n\t\t' + error)
  }
}

export async function getAllResidentsData(
  lastDoc?: DocumentReference | number,
  limit?: number,
) {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentsCollection = collectionWrapper(
      app,
      `providers/GYRHOME/residents`,
    ).withConverter(createResidentConverter(userRoles))

    // 1. Get the total count of residents
    const countSnapshot = await getCount(residentsCollection)
    const total = countSnapshot.data().count

    // 2. Get the paginated documents if pagination arguments are provided
    let collectionQuery = queryWrapper(
      residentsCollection,
      limit ? limitQuery(limit) : null, // limitQuery and startAfter are not directly available in firestore-server.ts
      lastDoc ? startAfter(lastDoc) : null,
    )
    // if (page && limit)
    //   collectionQuery = residentsCollection
    //     .limit(limit)
    //     .offset((page - 1) * limit) as any
    const residentsSnapshot = await getDocsWrapper<Resident, Resident>(
      collectionQuery,
    )
    const residentsForPage = residentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // 3. Fetch facility data only for the residents on the current page
    const facilitiesCollection = collectionWrapper<Facility>(
      app,
      'providers/GYRHOME/facilities',
    ).withConverter(facilityConverter)
    const facilitiesData = await getDocsWrapper(facilitiesCollection)
    const facility_lookup: { [id: string]: string } =
      facilitiesData.docs.reduce(
        (lookup: { [id: string]: any }, facility) => ({
          ...lookup,
          [facility.id]: facility.data().address,
        }),
        {},
      )

    // 4. Join the data
    const residentsWithAddress = residentsForPage.map((resident) => {
      const address =
        facility_lookup[resident.facility_id] || 'Address not found'
      return { ...resident, address }
    })

    return { residents: residentsWithAddress, total }
  } catch (error: any) {
    throw new Error('Failed to fetch All Residents Data:\n\t\t' + error)
  }
}
