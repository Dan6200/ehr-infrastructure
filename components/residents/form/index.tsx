"use client";
import { ResidentFormAdd } from "./ResidentFormAdd";
import { ResidentFormEdit } from "./ResidentFormEdit";
import type { Nullable } from "@/types";

interface ResidentFormProps {
  encrypted_resident_name?: Nullable<string>; // Changed from resident_name
  document_id?: Nullable<string>;
  resident_id?: Nullable<string>;
  facility_id: string;
  emergencyContacts?: Nullable<
    {
      encrypted_contact_name?: Nullable<string>; // Changed
      encrypted_cell_phone: string; // Changed
      encrypted_home_phone?: Nullable<string>; // Changed
      encrypted_work_phone?: Nullable<string>; // Changed
      encrypted_relationship?: Nullable<string>; // Changed
    }[]
  >;
}

export function ResidentForm({
  encrypted_resident_name, // Changed
  document_id,
  resident_id,
  facility_id,
  emergencyContacts,
}: ResidentFormProps) {
  if (document_id && resident_id) {
    return (
      <ResidentFormEdit
        encrypted_resident_name={encrypted_resident_name} // Changed
        document_id={document_id}
        resident_id={resident_id}
        facility_id={facility_id}
        emergencyContacts={emergencyContacts}
      />
    );
  } else {
    return <ResidentFormAdd facility_id={facility_id} />;
  }
}

