import { getAllResidentsData } from '#/actions/residents/get'
import ResidentList from '#/components/resident-list'
import ServerPagination from '#/components/server-pagination'
import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; prev?: string }>
}) {
  const LIMIT = 25
  const { next, prev } = await searchParams

  // The getAllResidentsData function will need to be updated to handle next/prev cursors
  // and return the new pagination info.
  const { residents, nextCursor, prevCursor, hasNextPage, hasPrevPage } =
    await getAllResidentsData({
      limit: LIMIT,
      nextCursorId: next,
      prevCursorId: prev,
    }).catch(async (e) => {
      if (e.toString().match(/(session|cookie)/i))
        await fetch(`${process.env.URL}:${process.env.PORT}/api/auth/logout`, {
          method: 'post',
        }).then(async (result) => {
          if (result.status === 200) redirect('/sign-in') // Navigate to the login page
        })
      console.error('Failed to fetch residentData:', e)
      return {
        residents: [],
        nextCursor: undefined,
        prevCursor: undefined,
        hasNextPage: false,
        hasPrevPage: false,
      } // Handle error gracefully
    })

  return (
    <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
      <ResidentList {...{ residentsData: residents }} />
      <ServerPagination
        {...{ nextCursor, prevCursor, hasNextPage, hasPrevPage }}
      />
    </main>
  )
}
