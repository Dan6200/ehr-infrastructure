import { getAllResidentsData } from './residents/actions/get'
import ResidentDataList from '@/components/resident-list'
import ServerPagination from '@/components/ui/server-pagination'

export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number((await searchParams)?.page) || 1
  const LIMIT = 25

  const { residents, total } = await getAllResidentsData(
    currentPage,
    LIMIT,
  ).catch((e) => {
    console.error('Failed to fetch residentData:', e)
    return { residents: [], total: 0 } // Handle error gracefully
  })

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
      <ResidentDataList {...{ residentsData: residents }} />
      <ServerPagination {...{ totalPages, currentPage }} />
    </main>
  )
}
