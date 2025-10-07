import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '@/actions/residents/get'
import { ResidentSchema, Resident as ResidentType } from '@/types'
import Resident from '@/components/resident'
import { GoBackLink } from '@/components/go-back-link'
import { ReactNode } from 'react'
import { ResidentNav } from '@/components/resident-nav'

export default async function ResidentLayout({
  children,
  params: { id },
}: {
  children: ReactNode
  params: { id: string }
}) {
  const rawResidentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) throw notFound()
    if (e.message.match(/insufficient permissions/)) redirect('/admin/sign-in')
    throw new Error(
      `Unable to pass props to Resident Component -- Tag:22.\n\t${e.message}`,
    )
  })
  let validatedResidentData: ResidentType
  try {
    validatedResidentData = ResidentSchema.parse(rawResidentData)
  } catch (error: any) {
    throw new Error('Invalid Resident Data -- Tag:31: ' + error.message)
  }

  return (
    <main className="bg-background flex flex-col items-start gap-4 container md:px-4 text-center py-24 sm:py-4 lg:py-24 h-fit">
      <GoBackLink
        url={`/admin/`}
        className="cursor-pointer text-blue-500 flex w-full gap-2 sm:gap-5"
      >
        Go To Previous Page
      </GoBackLink>
      <Resident residentData={validatedResidentData} id={id} />
      <ResidentNav residentId={id} />
      <div className="mt-8 w-full">{children}</div>
    </main>
  )
}
