import { getAllResidentsData } from '@/actions/residents/get'
import { ResidentsTable } from '@/components/dashboard/residents-table'

export default async function ResidentsPage() {
  const { residents } = await getAllResidentsData({})

  return (
    <div className="mx-auto py-10">
      <ResidentsTable data={residents} />
    </div>
  )
}
