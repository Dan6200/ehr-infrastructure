import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '@/actions/residents/get'
import Resident from '@/components/resident'
import { GoBackLink } from '@/components/go-back-link'
import { ReactNode, Suspense } from 'react'
import { ResidentNav } from '@/components/resident-nav'
import { ResidentLayoutSkeleton } from './loading-skeleton'

async function ResidentDataContainer({
  id,
  children,
}: {
  id: string
  children: ReactNode
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
    <>
      <Resident residentData={residentData} id={id} />
      <ResidentNav residentId={id} />
      <div className="w-full py-16 px-8 mx-auto bg-card inset-shadow-md rounded-md">
        {children}
      </div>
    </>
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
    <main className="bg-background flex flex-col items-start gap-2 container w-fit p-4 text-center h-fit">
      <GoBackLink className="cursor-pointer flex w-full gap-2 sm:gap-5">
        Go Back
      </GoBackLink>
      <Suspense fallback={<ResidentLayoutSkeleton />}>
        <ResidentDataContainer id={id}>{children}</ResidentDataContainer>
      </Suspense>
    </main>
  )
}
