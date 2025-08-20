import { deleteResidentData } from "../delete";
import { getResidentData } from "../get";
import { loadInitialData, clearFirestore } from "@/test-data/emulatorSetup";
import admin from "firebase-admin";

// Mock next/navigation functions
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    const error = new Error("not_found");
    (error as any).digest = "NEXT_NOT_FOUND";
    throw error;
  }),
  redirect: jest.fn(),
}));

describe("deleteResidentData", () => {
  beforeAll(async () => {
    await clearFirestore();
  });

  beforeEach(async () => {
    await loadInitialData();
  });

  afterEach(async () => {
    await clearFirestore();
  });

  it("should delete resident data successfully", async () => {
    const documentIdToDelete = "residentDoc1"; // From test-data/residents.json

    // Verify resident exists before deletion
    const residentBeforeDelete = await admin
      .firestore()
      .collection("residents")
      .doc(documentIdToDelete)
      .get();
    expect(residentBeforeDelete.exists).toBe(true);

    const result = await deleteResidentData(documentIdToDelete);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Successfully Deleted Resident");

    // Verify resident does not exist after deletion
    const residentAfterDelete = await admin
      .firestore()
      .collection("residents")
      .doc(documentIdToDelete)
      .get();
    expect(residentAfterDelete.exists).toBe(false);
  });

  it("should throw notFound if resident does not exist", async () => {
    const nonExistentDocumentId = "nonExistentDoc";

    await expect(deleteResidentData(nonExistentDocumentId)).rejects.toThrow("not_found");
  });
});
