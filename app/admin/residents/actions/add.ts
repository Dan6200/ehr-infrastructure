"use server";
import { collectionWrapper } from "@/firebase/firestore";
import db from "@/firebase/server/config";
import { Resident, residentConverter } from "@/types/resident";

export async function addNewResident(
  residentData: Omit<Resident, "resident_id">,
) {
  try {
    await db.runTransaction(async (transaction) => {
      const metadataRef = collectionWrapper("metadata").doc("lastResidentID");
      const metadataSnap = await transaction.get(metadataRef);
      if (!metadataSnap.exists)
        throw new Error("lastResidentID metadata not found");
      const { resident_id: oldResidentId } = metadataSnap.data() as { resident_id: string };
      const resident_id = (parseInt(oldResidentId) + 1).toString();
      const resident: Resident = {
        ...residentData,
        resident_id,
      };
      // Apply the converter
      const residentRef = collectionWrapper("residents")
        .withConverter(residentConverter)
        .doc();

      // Ensure the 'resident' object matches the 'Resident' type for the converter
      transaction.set(residentRef, resident);
      transaction.update(metadataRef, { resident_id });
    });
    return {
      message: "Successfully Added a New Resident",
      success: true,
    };
  } catch (error) {
    console.error("Failed to Add a New Resident.", error);
    return {
      success: false,
      message: "Failed to Add a New Resident",
    };
  }
}
