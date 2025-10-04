import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '@/app/admin/residents/actions/get'
import { ResidentSchema, Resident as ResidentType } from '@/types'
import Resident from '@/components/resident'
import { GoBackLink } from '@/components/go-back-link'

export default async function ResidentPage({
  params: { id },
}: {
  params: { id: string }
}) {
  const rawResidentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) throw notFound()
    if (e.message.match(/insufficient permissions/)) redirect('/admin/sign-in')
    throw new Error(
      `Unable to pass props to Resident Component -- Tag:22.\n\t${e}`,
    )
  })
  let validatedResidentData: ResidentType
  try {
    validatedResidentData = ResidentSchema.parse(rawResidentData)
  } catch (error: any) {
    throw new Error('Invalid Resident Data -- Tag:31: ' + error.message)
  }
  return (
    <main className="bg-background flex flex-col gap-16 container md:px-16 mx-auto text-center py-8 sm:py-16 lg:py-24 h-fit">
      <GoBackLink
        url={`/admin/`}
        className="cursor-pointer text-blue-700 flex w-full gap-2 sm:gap-5"
      >
        Go To Previous Page
      </GoBackLink>
      <Resident residentData={validatedResidentData} id={id} />
    </main>
  )
}
