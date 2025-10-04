'use client'
import { ResidentFormAdd } from './ResidentFormAdd'
import { ResidentFormEdit } from './ResidentFormEdit'
import type { Nullable } from '@/types'

interface ResidentFormProps {
  resident_name?: Nullable<string> // Changed from resident_name
  document_id?: Nullable<string>
  resident_id?: Nullable<string>
  facility_id: string
  emergencyContacts?: Nullable<
    {
      contact_name?: Nullable<string> // Changed
      cell_phone: string // Changed
      home_phone?: Nullable<string> // Changed
      work_phone?: Nullable<string> // Changed
      relationship?: Nullable<string> // Changed
    }[]
  >
}

export function ResidentForm({
  resident_name, // Changed
  document_id,
  resident_id,
  facility_id,
  emergencyContacts,
}: ResidentFormProps) {
  if (document_id && resident_id) {
    return (
      <ResidentFormEdit
        resident_name={resident_name} // Changed
        document_id={document_id}
        resident_id={resident_id}
        facility_id={facility_id}
        emergencyContacts={emergencyContacts}
      />
    )
  } else {
    return <ResidentFormAdd facility_id={facility_id} />
  }
}
