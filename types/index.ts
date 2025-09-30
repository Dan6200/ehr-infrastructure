//import { FieldValue } from "firebase/firestore";
export type Nullable<T> = T | null | undefined;

import { z } from "zod";
import { encrypt, decrypt } from "@/lib/encryption"; // Import encryption functions

export const EmergencyContactSchema = z.object({
  encrypted_contact_name: z.string().nullable().optional(),
  encrypted_cell_phone: z.string(),
  encrypted_work_phone: z.string().nullable().optional(),
  encrypted_home_phone: z.string().nullable().optional(),
  encrypted_relationship: z.string().nullable().optional(),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

// --- Facility Schema and Type ---
export const FacilitySchema = z.object({
  document_id: z.string(),
  room: z.string(),
  address: z.string(),
});
export type Facility = z.infer<typeof FacilitySchema>;

// --- Resident Schema and Type ---
export const ResidentSchema = z.object({
  resident_id: z.string(),
  encrypted_resident_name: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).nullable().optional(),
});
export type Resident = z.infer<typeof ResidentSchema>;

// --- RoomData Schema and Type ---
export const RoomResidentSchema = z.object({
  document_id: z.string(),
  resident_id: z.string(),
  encrypted_resident_name: z.string().nullable().optional(),
});
export const RoomDataSchema = z.object({
  document_id: z.string(),
  room: z.string(),
  address: z.string(),
  residents: z.array(RoomResidentSchema).nullable().optional(),
});
export type RoomData = z.infer<typeof RoomDataSchema>;

// Converters...
export const emergencyContactConverter: FirestoreDataConverter<EmergencyContact> =
  {
    toFirestore(contact: EmergencyContact): DocumentData {
      return EmergencyContactSchema.parse(contact);
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): EmergencyContact {
      return EmergencyContactSchema.parse(snapshot.data());
    },
  };

// Modified residentConverter to accept encryptionKey
export const createResidentConverter = (
  encryptionKey: string,
): FirestoreDataConverter<Resident> => ({
  toFirestore(resident: Resident): DocumentData {
    const encryptedResident = { ...resident };

    // Encrypt resident_name
    if (encryptedResident.encrypted_resident_name) {
      encryptedResident.encrypted_resident_name = encrypt(
        encryptedResident.encrypted_resident_name,
        encryptionKey,
      );
    }

    // Encrypt emergency contacts
    if (encryptedResident.emergencyContacts) {
      encryptedResident.emergencyContacts =
        encryptedResident.emergencyContacts.map((contact) => {
          const encryptedContact = { ...contact };
          if (encryptedContact.encrypted_contact_name) {
            encryptedContact.encrypted_contact_name = encrypt(
              encryptedContact.encrypted_contact_name,
              encryptionKey,
            );
          }
          if (encryptedContact.encrypted_cell_phone) {
            encryptedContact.encrypted_cell_phone = encrypt(
              encryptedContact.encrypted_cell_phone,
              encryptionKey,
            );
          }
          if (encryptedContact.encrypted_work_phone) {
            encryptedContact.encrypted_work_phone = encrypt(
              encryptedContact.encrypted_work_phone,
              encryptionKey,
            );
          }
          if (encryptedContact.encrypted_home_phone) {
            encryptedContact.encrypted_home_phone = encrypt(
              encryptedContact.encrypted_home_phone,
              encryptionKey,
            );
          }
          if (encryptedContact.encrypted_relationship) {
            encryptedContact.encrypted_relationship = encrypt(
              encryptedContact.encrypted_relationship,
              encryptionKey,
            );
          }
          return encryptedContact;
        });
    }

    return ResidentSchema.parse(encryptedResident);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Resident {
    const data = snapshot.data();
    const decryptedData: any = {
      resident_id: data.resident_id,
      document_id: snapshot.id,
      emergencyContacts: data.emergencyContacts || null,
    };

    // Decrypt resident_name
    if (data.encrypted_resident_name) {
      decryptedData.encrypted_resident_name = decrypt(
        data.encrypted_resident_name,
        encryptionKey,
      );
    }

    // Decrypt emergency contacts
    if (data.emergencyContacts && Array.isArray(data.emergencyContacts)) {
      decryptedData.emergencyContacts = data.emergencyContacts.map(
        (contact: any) => {
          const decryptedContact: any = { ...contact };
          if (contact.encrypted_contact_name) {
            decryptedContact.encrypted_contact_name = decrypt(
              contact.encrypted_contact_name,
              encryptionKey,
            );
          }
          if (contact.encrypted_cell_phone) {
            decryptedContact.encrypted_cell_phone = decrypt(
              contact.encrypted_cell_phone,
              encryptionKey,
            );
          }
          if (contact.encrypted_work_phone) {
            decryptedContact.encrypted_work_phone = decrypt(
              contact.encrypted_work_phone,
              encryptionKey,
            );
          }
          if (contact.encrypted_home_phone) {
            decryptedContact.encrypted_home_phone = decrypt(
              contact.encrypted_home_phone,
              encryptionKey,
            );
          }
          return decryptedContact;
        },
      );
    }

    return ResidentSchema.parse(decryptedData);
  },
});

export const facilityConverter: FirestoreDataConverter<Facility> = {
  toFirestore(contact: Facility): DocumentData {
    return FacilitySchema.parse(contact);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Facility {
    return FacilitySchema.parse(snapshot.data());
  },
};
