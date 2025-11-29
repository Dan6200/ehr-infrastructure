'use client'
import { ResidentData } from '#root/types'
import { ResidentFormAdd } from './ResidentFormAdd'
import { ResidentFormEdit } from './ResidentFormEdit'

export function ResidentForm({
  ...residentData
}: Omit<ResidentData, 'address'>) {
  if (residentData.id) {
    return <ResidentFormEdit residentData={residentData} />
  } else {
    return <ResidentFormAdd facility_id={residentData.facility_id || ''} />
  }
}
