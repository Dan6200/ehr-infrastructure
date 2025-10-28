'use server'

import { verifySession } from '@/auth/server/definitions'
import {
  collectionWrapper,
  docWrapper,
  getDocWrapper,
  getDocsWrapper,
} from '@/firebase/admin'
import {
  Resident,
  ResidentDataSchema,
  ResidentSchema,
  EncryptedResidentSchema,
  SubCollectionMapType,
  AllCollectionData,
  subCollectionMap,
} from '@/types'
import { decryptResidentData, getResidentConverter } from '@/types/converters'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { Query } from 'firebase-admin/firestore'
import { getNestedResidentData } from './subcollections'
import { getAllFacilities } from './facilities'

type K = keyof SubCollectionMapType

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
  ...subCollections: K[]
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

    const allFacilities = await getAllFacilities()
    const facility = allFacilities.find((f) => f.id === resident.facility_id)
    const address = facility ? facility.address : 'Address not found'

    // Fetch and decrypt subcollections in parallel
    const nestedData = await Promise.all(
      subCollections.map((subCol) => getNestedResidentData(documentId, subCol)),
    )

    const nestedDataMapped = nestedData.reduce(
      (bucket, data, index) => {
        const filteredData = (data || []).filter(
          (item): item is NonNullable<typeof item> => item !== undefined,
        )

        bucket[subCollections[index]] = subCollectionMap[
          subCollections[index]
        ].schema.parse(filteredData) as any
        return bucket
      },
      {} as {
        [P in keyof SubCollectionMapType]: z.infer<
          SubCollectionMapType[P]['schema']
        >[]
      },
    )

    return ResidentDataSchema.parse({
      ...resident,
      id: residentSnap.id,
      address,
      ...nestedDataMapped,
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

    const allFacilities = await getAllFacilities()
    const facility_lookup: { [id: string]: string } = allFacilities.reduce(
      (lookup: { [id: string]: any }, facility) =>
        facility.id
          ? {
              ...lookup,
              [facility.id]: facility.address,
            }
          : lookup,
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
