import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '#root/actions/residents/get'
import Resident from '#root/components/resident'
import { GoBackLink } from '#root/components/go-back-link'
import { ReactNode, Suspense } from 'react'
import { ResidentNav } from '#root/components/resident-nav'
import { ResidentLayoutSkeleton } from './loading-skeleton'

async function ResidentDataContainer({
  id,
  children,
  className,
}: {
  id: string
  children: ReactNode
  className: string
}) {
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) throw notFound()
    if (e.message.match(/(insufficient permissions|invalid session)/i))
      redirect('/admin/sign-in')
    throw new Error(
      `Unable to pass props to Resident Component -- Tag:22.\n\t${e.message}`,
    )
  })

  return (
    <div className={className}>
      <Resident residentData={residentData} id={id} />
      <ResidentNav residentId={id} />
      <div className="w-full py-8 px-4 lg:py-16 lg:px-8 mx-auto bg-card shadow-inner-md rounded-b-md border-b border-x">
        {children}
      </div>
    </div>
  )
}

export default async function ResidentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="bg-background flex flex-col md:flex-row items-start justify-between container w-full p-4 lg:p-8 text-center h-fit">
      <GoBackLink className="cursor-pointer flex md:w-1/6 gap-2 sm:gap-5">
        Go Back
      </GoBackLink>
      <div className="w-full">
        <Suspense fallback={<ResidentLayoutSkeleton />}>
          <ResidentDataContainer
            id={id}
            className="w-full md:w-fit md:flex-grow md:px-16"
          >
            {children}
          </ResidentDataContainer>
        </Suspense>
      </div>
    </main>
  )
}
