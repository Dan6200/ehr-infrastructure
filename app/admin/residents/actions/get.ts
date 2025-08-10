"use server";
import { collectionWrapper } from "@/firebase/firestore";
import {
  isTypeEmergencyContact,
  isTypeResidence,
  isTypeResident,
  Resident,
  Residence,
  RoomData,
} from "@/types/resident";
import { notFound } from "next/navigation";

export async function getResidentData(documentId: string) {
  try {
    const residentsColRef = collectionWrapper("residents");
    const residentsSnap = await residentsColRef.doc(documentId).get();
    if (!residentsSnap.exists) throw notFound();
    const resident = residentsSnap.data();
    if (!isTypeResident(resident))
      throw new Error("Object is not of type Resident  -- Tag:16");

    return { ...resident, document_id: residentsSnap.id };
  } catch (error) {
    throw new Error("Failed to fetch resident.\n\t\t" + error);
  }
}

export async function getResidents() {
  try {
    const residentsCollection = collectionWrapper("residents");
    const residentsSnap = await residentsCollection.get();
    return residentsSnap.docs.map((doc) => {
      const resident = doc.data();
      if (!isTypeResident(resident))
        throw new Error("Object is not of type Resident  -- Tag:19");
      return resident;
    });
  }
  catch (error) {
    throw new Error("Failed to fetch All Residents Data.\n\t\t" + error);
  }
}

export async function getAllRooms() {
  try {
    const roomsCollection = collectionWrapper("residence");
    const roomsSnap = await roomsCollection.get();
    if (!roomsSnap.size) throw notFound();
    return roomsSnap.docs.map((doc) => {
      const residence = doc.data();
      if (!isTypeResidence(residence))
        throw new Error("Object is not of type Residence  -- Tag:19");
      return { document_id: doc.id, ...residence };
    });
  }
  catch (error) {
    throw new Error("Failed to fetch All Room Data.\n\t\t" + error);
  }
}

export async function getRoomData(residenceId: string) {
  /******************************************
   * Creates a Join Between Residence,
   * Emergency Contacts and Resident documents on residenceId
   * *********************************************************/

  try {
    const addressCollection = collectionWrapper("residence");
    const addressSnap = await addressCollection.doc(residenceId).get();
    const residents_map: { [key: string]: Resident } = {};
    const room_map: { [key: string]: RoomData } = {};
    if (!addressSnap.exists) throw notFound();
    const address = {
      ...(addressSnap.data() as Residence),
      document_id: addressSnap.id,
    };
    if (!isTypeResidence(address))
      throw new Error("Object is not of type Residence -- Tag:10");
    room_map[address.residence_id] = {
      ...room_map[address.residence_id],
      ...address,
      residents: null,
    };

    // Fetch and join resident data...
    const residentsCollection = collectionWrapper("residents");
    const resQ = residentsCollection.where(
      "residence_id",
      "==",
      address.residence_id
    );
    const residentsData = await resQ.get();
    for (const doc of residentsData.docs) {
      if (!doc.exists) throw notFound();
      let resident = doc.data();
      if (!isTypeResident(resident))
        throw new Error("Object is not of type Resident -- Tag:9");

      // Add each resident to the residents map
      // Handle duplicates
      if (residents_map[resident.resident_id])
        throw new Error("Duplicate Resident Data! -- Tag:28");
      const { residence_id, ...newResident } = resident;
      residents_map[resident.resident_id] = {
        ...newResident,
        document_id: doc.id,
      };

      // Add all residents in the resident map to the room map
      room_map[resident.residence_id] = {
        ...room_map[resident.residence_id],
        residents: [
          ...(room_map[resident.residence_id].residents ?? []),
          residents_map[resident.resident_id],
        ],
      };
    }

    if (Object.values(room_map).length > 1)
      throw new Error("Duplicate Room Data! -- Tag:28");
    const roomData = Object.values(room_map)[0];
    return roomData;
  }
  catch (error) {
    throw new Error("Failed to fetch All Residents Data:\n\t\t" + error);
  }
}
