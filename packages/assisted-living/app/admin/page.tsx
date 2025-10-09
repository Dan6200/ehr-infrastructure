import { getAllResidentsData } from '@/actions/residents/get'
import ResidentList from '@/components/resident-list'
import ServerPagination from '@/components/server-pagination'
import { redirect } from 'next/navigation'

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
  ).catch(async (e) => {
    if (e.toString().match(/(session|cookie)/i))
      await fetch(`${process.env.URL}:${process.env.PORT}/api/auth/logout`, {
        method: 'post',
      }).then(async (result) => {
        if (result.status === 200) redirect('/sign-in') // Navigate to the login page
      })
    console.error('Failed to fetch residentData:', e)
    return { residents: [], total: 0 } // Handle error gracefully
  })

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
      <ResidentList {...{ residentsData: residents }} />
      <ServerPagination {...{ totalPages, currentPage }} />
    </main>
  )
}
