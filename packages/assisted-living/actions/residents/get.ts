'use server'
import {
  collectionWrapper,
  getCount,
  queryWrapper,
  limitQuery,
  startAfter,
  getDocsWrapper,
} from '@/firebase/firestore'
import {
  Resident,
  Facility,
  ResidentSchema,
  FacilitySchema,
  ResidentDataSchema,
  facilityConverter,
  createResidentConverter,
} from '@/types'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { getVerifiedSessionCookie } from '@/firebase/auth/server/definitions'
import { DocumentReference } from 'firebase/firestore'

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentDataSchema>> {
  try {
    const idToken = await getVerifiedSessionCookie()
    if (!idToken) throw new Error('Failed to verify session token')
    const userRoles: string[] = idToken.claims.roles || []

    const residentsColRef = collectionWrapper(
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
    const facilitySnap = await collectionWrapper('providers/GYRHOME/facilities')
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
    const residentsCollection = collectionWrapper('residents')
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
    const facilitiesCollection = collectionWrapper(
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
  lastDoc?: DocumentReference,
  limit?: number,
) {
  try {
    const idToken = await getVerifiedSessionCookie()
    if (!idToken) throw new Error('Failed to verify session token')
    const userRoles: string[] = idToken.roles || []

    const residentsCollection = collectionWrapper(
      `providers/GYRHOME/residents`,
    ).withConverter(createResidentConverter(userRoles))

    // 1. Get the total count of residents
    const countSnapshot = await getCount(residentsCollection)
    const total = countSnapshot.data().count

    // 2. Get the paginated documents if pagination arguments are provided
    let collectionQuery = queryWrapper(
      residentsCollection,
      limit ? limitQuery(limit) : null,
      lastDoc ? startAfter(lastDoc) : null,
    )
    // if (page && limit)
    //   collectionQuery = residentsCollection
    //     .limit(limit)
    //     .offset((page - 1) * limit) as any
    const residentsSnapshot = await getDocsWrapper(collectionQuery)
    const residentsForPage = residentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // 3. Fetch facility data only for the residents on the current page
    const facilitiesCollection = collectionWrapper(
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
