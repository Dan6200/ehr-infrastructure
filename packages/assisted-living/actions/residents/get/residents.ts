'use server'

import { verifySession } from '#root/auth/server/definitions'
import {
  collectionWrapper,
  docWrapper,
  getDocWrapper,
  getDocsWrapper,
} from '#root/firebase/admin'
import {
  Resident,
  ResidentDataSchema,
  ResidentSchema,
} from '#root/types/schemas/administrative/resident'
import { EncryptedResidentSchema } from '#root/types/encrypted-schemas'
import {
  decryptResidentData,
  getResidentConverter,
} from '#root/types/converters/residents/main'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { Query } from 'firebase-admin/firestore'
import { getAllFacilities } from './facilities'
import {
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
} from '#root/lib/encryption'

// Use a DTO for resident data
export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentDataSchema>> {
  try {
    const { provider_id, roles: userRoles = [] } = await verifySession()
    const kekPaths = { KEK_GENERAL_PATH, KEK_CONTACT_PATH, KEK_CLINICAL_PATH }

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
    ).withConverter(await getResidentConverter())

    const residentRef = await docWrapper(residentsCollection, documentId)
    const residentSnap = await getDocWrapper(residentRef)

    if (!residentSnap.exists) throw notFound()

    const resident = {
      created_at: residentSnap.createTime!.toDate().toISOString(),
      ...(await decryptResidentData(residentSnap.data()!, userRoles, kekPaths)),
      updated_at: residentSnap.updateTime!.toDate().toISOString(),
      viewed_at: residentSnap.readTime!.toDate().toISOString(),
    }

    const allFacilities = await getAllFacilities()
    const facility = allFacilities.find((f) => f.id === resident.facility_id)
    const address = facility ? facility.address : 'Address not found'

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
    const { provider_id, roles: userRoles = [] } = await verifySession()
    const kekPaths = { KEK_GENERAL_PATH, KEK_CONTACT_PATH, KEK_CLINICAL_PATH }

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
    ).withConverter(await getResidentConverter())
    const residentsSnap = await getDocsWrapper(residentsCollection)

    return Promise.all(
      residentsSnap.docs.map(async (doc) => {
        const resident = await decryptResidentData(
          doc.data(),
          userRoles,
          kekPaths,
        )
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
    const { provider_id, roles: userRoles = [] } = await verifySession()
    const kekPaths = { KEK_GENERAL_PATH, KEK_CONTACT_PATH, KEK_CLINICAL_PATH }

    const residentsCollection = (
      await collectionWrapper<z.infer<typeof EncryptedResidentSchema>>(
        `providers/${provider_id}/residents`,
      )
    ).withConverter(await getResidentConverter())

    let query: Query<z.infer<typeof EncryptedResidentSchema>> =
      residentsCollection
        .where('deactivated_at', '==', null)
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
        query = limit
          ? query.endBefore(cursorDoc).limitToLast(limit + 1)
          : query.endBefore(cursorDoc)
      }
    }

    if (!isPrev) {
      query = limit ? query.limit(limit + 1) : query
    }

    const residentsSnapshot = await getDocsWrapper(query)

    let residentsForPage = await Promise.all(
      residentsSnapshot.docs.map(async (doc) => ({
        id: doc.id,
        created_at: doc.createTime.toDate().toISOString(),
        ...(await decryptResidentData(doc.data(), userRoles, kekPaths)),
        updated_at: doc.updateTime.toDate().toISOString(),
        viewed_at: doc.readTime.toDate().toISOString(),
      })),
    )

    if (residentsForPage.length > 0) {
      ResidentSchema.parse(residentsForPage[0])
    }

    let hasNextPage = false
    let hasPrevPage = false

    if (isPrev) {
      hasPrevPage = residentsForPage.length > limit
      if (hasPrevPage) {
        residentsForPage.shift()
      }
      hasNextPage = true
    } else {
      hasNextPage = residentsForPage.length > limit
      if (hasNextPage) {
        residentsForPage.pop()
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
    // TODO: Move to components to avoid complex url building
    // if (error.toString().match(/(cookies|session|authenticate)/i)) {
    //   const url = `${process.env.HOST}${process.env.PORT ? ':' + process.env.PORT : ''}/api/auth/logout`
    //   await fetch(url, {
    //     method: 'post',
    //   }).finally(async () => {
    //     redirect('/sign-in')
    //   })
    // }
    throw new Error(`Failed to fetch all residents data: ${error.message}`)
  }
}
