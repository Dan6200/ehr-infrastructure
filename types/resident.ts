//import { FieldValue } from "firebase/firestore";
export type Nullable<T> = T | null | undefined;

import { z } from "zod";

export const EmergencyContactSchema = z.object({
  contact_name: z.string().nullable().optional(),
  cell_phone: z.string(),
  work_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

// --- Residence Schema and Type ---
export const ResidenceSchema = z.object({
  residence_id: z.string(),
  roomNo: z.string(),
  address: z.string(),
});
export type Residence = z.infer<typeof ResidenceSchema>;

// --- Resident Schema and Type ---
export const ResidentSchema = z.object({
  resident_id: z.string(),
  residence_id: z.string(),
  resident_name: z.string().nullable().optional(),
  document_id: z.string().nullable().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).nullable().optional(),
});
export type Resident = z.infer<typeof ResidentSchema>;

// --- RoomData Schema and Type ---
export const RoomResidentSchema = z.object({
  document_id: z.string(),
  resident_id: z.string(),
  resident_name: z.string().nullable().optional(),
});
export const RoomDataSchema = z.object({
  document_id: z.string(),
  residence_id: z.string(),
  roomNo: z.string(),
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

export const residentConverter: FirestoreDataConverter<Resident> = {
  toFirestore(resident: Resident): DocumentData {
    return ResidentSchema.parse(resident);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Resident {
    const data = snapshot.data();
    return ResidentSchema.parse({
      resident_id: data.resident_id,
      residence_id: data.residence_id,
      resident_name: data.resident_name,
      document_id: snapshot.id,
      emergencyContacts: data.emergencyContacts || null,
    });
  },
};

export const residenceConverter: FirestoreDataConverter<Residence> = {
  toFirestore(contact: Residence): DocumentData {
    return ResidenceSchema.parse(contact);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Residence {
    return ResidenceSchema.parse(snapshot.data());
  },
};

