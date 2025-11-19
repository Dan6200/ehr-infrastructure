import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '#root/actions/residents/get'
import { ResidentSchema, Resident as ResidentType } from '#root/types'
import Resident from '#root/components/resident'
import { GoBackLink } from '#root/components/go-back-link'
import { ReactNode } from 'react'
import { ResidentNav } from '#root/components/resident-nav'

export default async function ResidentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) throw notFound()
    if (e.message.match(/insufficient permissions/)) redirect('/admin/sign-in')
    throw new Error(
      `Unable to pass props to Resident Component -- Tag:22.\n\t${e.message}`,
    )
  })

  return (
    <main className="bg-background flex flex-col items-start gap-4 container md:px-4 text-center py-24 sm:py-4 lg:py-24 h-fit">
      <GoBackLink
        url={`/admin/dashboard`}
        className="cursor-pointer flex w-full gap-2 sm:gap-5"
      >
        Go To Previous Page
      </GoBackLink>
      <Resident residentData={residentData} id={id} />
      <ResidentNav residentId={id} />
      <div className="mt-8 w-full">{children}</div>
    </main>
  )
}
