'use server'
import { collectionWrapper } from '@/firebase/firestore'
import {
  Resident,
  Facility,
  ResidentData,
  ResidentSchema,
  FacilitySchema,
  ResidentDataSchema,
  facilityConverter,
  createResidentConverter,
} from '@/types'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { getEncryptionKey } from '../../actions/get-encryption-key'

export async function getResidentData(
  documentId: string,
): Promise<z.infer<typeof ResidentSchema>> {
  try {
    const residentsColRef = collectionWrapper('residents')
    const residentsSnap = await residentsColRef.doc(documentId).get()
    if (!residentsSnap.exists) throw notFound()
    const resident = residentsSnap.data()
    let validatedResident: Resident
    try {
      validatedResident = ResidentSchema.parse(resident)
    } catch (error: any) {
      throw new Error(
        'Object is not of type Resident  -- Tag:16: ' + error.message,
      )
    }

    return { ...validatedResident, document_id: residentsSnap.id }
  } catch (error) {
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

export async function getAllResidentsData(idToken: string) {
  try {
    // const facilityCollection = collectionWrapper(
    //   "providers/GYRHOME/facilities",
    // );
    // const facilitySnap = await facilityCollection.doc(facilityDocId).get();
    // const facility_map: { [key: string]: Facility } = {};
    // const residents_map: { [key: string]: Resident } = {};
    // if (!facilitySnap.exists) throw notFound();
    // const facility = {
    //   ...(facilitySnap.data() as Facility),
    //   document_id: facilitySnap.id,
    // };
    // let validatedFacility: Facility;
    // try {
    //   validatedFacility = FacilitySchema.parse(facility);
    // } catch (error: any) {
    //   throw new Error(
    //     "Object is not of type Facility -- Tag:10: " + error.message,
    //   );
    // }
    // facility_map[validatedFacility.document_id] = {
    //   ...facility_map[validatedFacility.document_id],
    //   ...validatedFacility,
    //   residents: null,
    // };
    //
    // // Fetch and join resident data...
    // const residentsCollection = collectionWrapper(
    //   `providers/GYRHOME/residents`,
    // );
    // const resQ = residentsCollection;
    // const residentsData = await resQ.get();
    //
    // for (const doc of residentsData.docs) {
    //   if (!doc.exists) throw notFound();
    //   let resident = doc.data(),
    //     validatedResident: Resident;
    //   try {
    //     validatedResident = ResidentSchema.parse(resident);
    //   } catch (error: any) {
    //     throw new Error(
    //       "Object is not of type Resident -- Tag:9: " + error.message,
    //     );
    //   }
    //
    //   // Add each resident to the residents map
    //   // Handle duplicates
    //   if (residents_map[doc.id])
    //     throw new Error("Duplicate Resident Data! -- Tag:28");
    //   residents_map[validatedResident.resident_id] = {
    //     ...validatedResident,
    //     document_id: doc.id,
    //   };
    //
    //   // Add all residents in the resident map to the facility map
    //   facility_map[resident.document_id] = {
    //     ...facility_map[resident.document_id],
    //     residents: [
    //       ...(facility_map[resident.document_id].residents ?? []),
    //       residents_map[resident.resident_id],
    //     ] as any,
    //   };
    // }
    //
    // if (Object.values(facility_map).length > 1)
    //   throw new Error("Duplicate Facility Data! -- Tag:28");
    // const facilityData = Object.values(facility_map)[0];
    // let validatedFacilityData: FacilityData;
    // try {
    //   validatedFacilityData = FacilityDataSchema.parse(facilityData);
    // } catch (error: any) {
    //   throw new Error(
    //     "Object is not of type FacilityData -- Tag:29: " + error.message,
    //   );
    // }
    // return validatedFacilityData
  } catch (error) {
    throw new Error('Failed to fetch All Residents Data:\n\t\t' + error)
  }
  try {
    // Fetch and join address data...
    const { key: encryptionKey } = await getEncryptionKey(idToken)
    if (!encryptionKey) throw new Error('failed to retrieve encryption key')
    const facilitiesCollection = collectionWrapper(
      'providers/GYRHOME/facilities',
    ).withConverter(facilityConverter)
    const facilitiesData = await facilitiesCollection.get()
    const residentsCollection = collectionWrapper(
      `providers/GYRHOME/residents`,
    ).withConverter(createResidentConverter(encryptionKey))
    const resQ = residentsCollection
    const residentsData = await resQ.get()
    const facility_lookup: { [id: string]: Facility } =
      facilitiesData.docs.reduce(
        (lookup: { [id: string]: any }, facility) =>
          (lookup[facility.id] = facility.data()),
        {},
      )
    return residentsData.docs.reduce((residents: any, resident) => {
      const address = facility_lookup[resident.data().facility_id]
      const { facility_id, ...newRes } = resident.data()
      return [
        ...(residents ?? []),
        { ...newRes, document_id: resident.id, address },
      ]
    }, [])
  } catch (error) {
    throw new Error('Failed to fetch All Residents Data:\n\t\t' + error)
  }
}
