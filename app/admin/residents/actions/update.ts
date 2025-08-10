"use server";
import { collectionWrapper } from "@/firebase/firestore";
import db from "@/firebase/server/config";
import { Resident } from "@/types/resident";
import { notFound } from "next/navigation";

export async function updateResident(
  newResidentData: Resident,
  documentId: string
) {
  try {
    await db.runTransaction(async (transaction) => {
      const residentRef = collectionWrapper("residents").doc(documentId);
      const resSnap = await transaction.get(residentRef);
      if (!resSnap.exists) throw notFound();
      transaction.update(residentRef, newResidentData);
    });
    return {
      success: true,
      message: "Successfully Updated Resident Information",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to Update the Resident",
    };
  }
}
