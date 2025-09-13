"use server";
import { collectionWrapper } from "@/firebase/firestore";
import db from "@/firebase/server/config";
import { Resident, createResidentConverter } from "@/types/resident"; // Import createResidentConverter
import { getEncryptionKey } from "@/app/admin/actions/get-encryption-key"; // Import getEncryptionKey

export async function addNewResident(
  residentData: Omit<Resident, "resident_id">,
  idToken: string // Accept idToken as an argument
) {
  try {
    // Fetch the encryption key
    const { key: encryptionKey, error: keyError } = await getEncryptionKey(idToken);
    if (keyError || !encryptionKey) {
      console.error("Failed to retrieve encryption key:", keyError);
      return {
        success: false,
        message: "Failed to add new resident: Encryption key not available.",
      };
    }

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
      // Apply the converter with the encryption key
      const residentRef = collectionWrapper("residents")
        .withConverter(createResidentConverter(encryptionKey)) // Use createResidentConverter
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