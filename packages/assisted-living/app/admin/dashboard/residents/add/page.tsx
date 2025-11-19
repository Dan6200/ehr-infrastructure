import { ResidentFormAdd } from '#root/components/residents/form/ResidentFormAdd'

export default function AddResidentPage() {
  // We can pass a default facility_id if needed, or leave it undefined
  return <ResidentFormAdd facility_id="" />
}
