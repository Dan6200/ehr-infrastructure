import { GoBackLink } from '#root/components/go-back-link'
import { ResidentForm } from '#root/components/residents/form'
import { getResidentData } from '#root/actions/residents/get'

export default async function EditResidentPage({
  params,
}: {
  params: Promise<{ resId: string }>
}) {
  const { resId } = await params
  const residentData = await getResidentData(resId)

  // Ensure id is present for edit mode
  if (!residentData.id) {
    // Handle the case where data is incomplete for editing
    // For example, throw notFound() or redirect to an error page
    throw new Error('Resident data is incomplete for editing.')
  }
  const { address, ...dataToEdit } = residentData

  return (
    <main className="flex flex-col gap-5 bg-background container w-full md:w-2/3 mx-auto py-32">
      <GoBackLink className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5">
        Go To Previous Page
      </GoBackLink>
      <ResidentForm {...{ ...dataToEdit }} />
    </main>
  )
}
