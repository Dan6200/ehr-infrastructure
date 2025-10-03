import { getAllResidentsData } from './residents/actions/get'
import PaginatedResidentList from '@/components/paginated-resident-list'

export default async function Home() {
  const residentsData = await getAllResidentsData().catch((e) => {
    console.error('Failed to fetch residentData:', e)
    return null // Handle error gracefully
  })

  if (!residentsData) {
    // This can be a more specific error message or component
    return (
      <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
        Error loading residents.
      </main>
    )
  }

  return (
    <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
      <PaginatedResidentList {...{ residentsData }} />
    </main>
  )
}
