import { getAllResidents } from '#root/actions/residents/get'
import { ResidentsTable } from '#root/components/dashboard/residents-table'

export default async function ResidentsPage() {
  const { residents } = await getAllResidents({})

  return (
    <div className="mx-auto py-10">
      <ResidentsTable data={residents} />
    </div>
  )
}
