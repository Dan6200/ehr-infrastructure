'use server'

import { getAuthenticatedAppAndClaims } from '@/auth/server/definitions'
import {
  collectionWrapper,
  docWrapper,
  getDocWrapper,
  getDocsWrapper,
  queryWrapper,
  collection,
} from '@/firebase/firestore-server'
import {
  Allergy,
  EncryptedResident,
  Facility,
  FacilitySchema,
  FinancialTransaction,
  MedicalRecord,
  Medication,
  Resident,
  ResidentDataSchema,
  ResidentSchema,
  Vital,
  EmergencyContact,
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

import { decryptData } from '@/lib/encryption'

// --- Subcollection Getters ---
async function getSubcollection<T extends z.ZodTypeAny>(
  residentId: string,
  collectionName: string,
  dek: Buffer,
  schema: T,
): Promise<z.infer<T>[]> {
  const authenticatedApp = await getAuthenticatedAppAndClaims()
  if (!authenticatedApp) throw new Error('Failed to authenticate session')
  const { app } = authenticatedApp

  const subcollectionRef = collection(
    app,
    `providers/GYRHOME/residents/${residentId}/${collectionName}`,
  )
  const snapshot = await getDocsWrapper(subcollectionRef)

  return snapshot.docs.map((doc) => {
    const encryptedData = doc.data()
    const decryptedData: { [key: string]: any } = { id: doc.id }
    for (const key in encryptedData) {
      if (key.startsWith('encrypted_')) {
        const newKey = key.replace('encrypted_', '')
        decryptedData[newKey] = decryptData(encryptedData[key], dek)
      }
    }
    // Special handling for financial amounts which are numbers
    if (collectionName === 'financials' && decryptedData.amount) {
      decryptedData.amount = parseFloat(decryptedData.amount)
    }
    return schema.parse(decryptedData)
  })
}

import {
  decryptDataKey,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
} from '@/lib/encryption'

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentDataSchema>> {
  try {
    const authenticatedApp = await getAuthenticatedAppAndClaims()
    if (!authenticatedApp) throw new Error('Failed to authenticate session')
    const { app, idToken } = authenticatedApp
    const userRoles: string[] = (idToken?.roles as string[]) || []

    const residentRef = await docWrapper(
      (
        await collectionWrapper<EncryptedResident>(
          app,
          `providers/GYRHOME/residents`,
        )
      ).withConverter(await getResidentConverter()),
      documentId,
    )
    const residentSnap = await getDocWrapper(residentRef)

    if (!residentSnap.exists()) throw notFound()

    const resident = await decryptResidentData(residentSnap.data(), userRoles)
    const encryptedResidentData = residentSnap.data()

    // Decrypt DEKs
    const contactDek = await decryptDataKey(
      Buffer.from(encryptedResidentData.encrypted_dek_contact, 'base64'),
      KEK_CONTACT_PATH,
    )
    const clinicalDek = await decryptDataKey(
      Buffer.from(encryptedResidentData.encrypted_dek_clinical, 'base64'),
      KEK_CLINICAL_PATH,
    )
    const financialDek = await decryptDataKey(
      Buffer.from(encryptedResidentData.encrypted_dek_financial, 'base64'),
      KEK_FINANCIAL_PATH,
    )

    // Fetch and decrypt subcollections in parallel
    const [
      allergies,
      medications,
      vitals,
      medical_records,
      emergency_contacts,
      financials,
    ] = await Promise.all([
      getSubcollection(documentId, 'allergies', clinicalDek, AllergySchema),
      getSubcollection(
        documentId,
        'medications',
        clinicalDek,
        MedicationSchema,
      ),
      getSubcollection(documentId, 'vitals', clinicalDek, VitalSchema),
      getSubcollection(
        documentId,
        'medical_records',
        clinicalDek,
        MedicalRecordSchema,
      ),
      getSubcollection(
        documentId,
        'emergency_contacts',
        contactDek,
        EmergencyContactSchema,
      ),
      getSubcollection(
        documentId,
        'financials',
        financialDek,
        FinancialTransactionSchema,
      ),
    ])

    const facilityDocRef = await docWrapper(
      (
        await collectionWrapper<Facility>(app, 'providers/GYRHOME/facilities')
      ).withConverter(await getFacilityConverter()),
      resident.facility_id,
    )
    const facilitySnap = await getDocWrapper(facilityDocRef)
    const address = facilitySnap.exists()
      ? facilitySnap.data().address
      : 'Address not found'

    return ResidentDataSchema.parse({
      ...resident,
      id: residentSnap.id,
      address,
      allergies,
      medications,
      vitals,
      medical_records,
      emergency_contacts,
      financials,
    })
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
