'use client'
import { ResidentFormAdd } from './ResidentFormAdd'
import { ResidentFormEdit } from './ResidentFormEdit'
import type { Resident } from '#root/types'

export function ResidentForm({
  ...residentData
}: Partial<Resident> & { id?: string }) {
  if (residentData.id) {
    return <ResidentFormEdit {...(residentData as Resident & { id: string })} />
  } else {
    return <ResidentFormAdd facility_id={residentData.facility_id || ''} />
  }
}
