'use client'
import { ResidentFormAdd } from './ResidentFormAdd'
import { ResidentFormEdit } from './ResidentFormEdit'
import type { Nullable, ResidentData } from '#/types'

export function ResidentForm({
  ...residentData
}: Omit<ResidentData, 'address'>) {
  if (residentData.id) {
    return <ResidentFormEdit {...{ ...residentData }} />
  } else {
    return <ResidentFormAdd facility_id={residentData.facility_id} />
  }
}
