import { addNewResident } from "../add";
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

describe("addNewResident", () => {
  beforeAll(async () => {
    // Ensure emulator is running and clear it before all tests
    await clearFirestore();
  });

  beforeEach(async () => {
    // Load initial data before each test
    await loadInitialData();
  });

  afterEach(async () => {
    // Clear data after each test
    await clearFirestore();
  });

  it("should add a new resident and increment resident_id", async () => {
    const newResident = {
      resident_name: "New Test Resident",
      residence_id: "CC9999",
      emergencyContacts: [
        {
          contact_name: "New Contact",
          cell_phone: "123-456-7890",
        },
      ],
    };

    const result = await addNewResident(newResident);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Successfully Added a New Resident");

    // Verify resident_id was incremented
    const metadataSnap = await admin
      .firestore()
      .collection("metadata")
      .doc("lastResidentID")
      .get();
    expect(metadataSnap.exists).toBe(true);
    expect(metadataSnap.data()?.resident_id).toBe("323"); // Original was 322

    // Verify the new resident exists and has the correct resident_id
    const residentsSnap = await admin
      .firestore()
      .collection("residents")
      .where("resident_name", "==", "New Test Resident")
      .get();
    expect(residentsSnap.docs.length).toBe(1);
    const addedResident = residentsSnap.docs[0].data();
    expect(addedResident.resident_id).toBe("323");
    expect(addedResident.residence_id).toBe("CC9999");
  });

  it("should return success: false if lastResidentID metadata is missing", async () => {
    // Clear metadata to simulate missing lastResidentID
    await admin.firestore().collection("metadata").doc("lastResidentID").delete();

    const newResident = {
      resident_name: "Another Test Resident",
      residence_id: "CC8888",
      emergencyContacts: [],
    };

    const result = await addNewResident(newResident);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Failed to Add a New Resident");
  });
});
