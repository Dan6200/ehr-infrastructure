'use server'

import { verifySession } from '#root/auth/server/definitions'
import { collectionWrapper, getDocsWrapper } from '#root/firebase/admin'
import {
  Facility,
  FacilitySchema,
} from '#root/types/schemas/administrative/facility'
import { getFacilityConverter } from '#root/types/converters'
import { notFound } from 'next/navigation'

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
