import { GoBackLink } from '@/components/go-back-link'
import { ResidentForm } from '@/components/residents/form'
import { getResidentData } from '@/actions/residents/get'

export default async function EditResidentPage({
  params: { resId },
}: {
  params: { resId: string }
}) {
  const residentData = await getResidentData(resId)

  // Ensure id is present for edit mode
  if (!residentData.id) {
    // Handle the case where data is incomplete for editing
    // For example, throw notFound() or redirect to an error page
    throw new Error('Resident data is incomplete for editing.')
  }

  return (
    <main className="flex flex-col gap-5 bg-background container w-full md:w-2/3 mx-auto py-32">
      <GoBackLink className="cursor-pointer text-blue-700 flex w-full sm:w-3/5 gap-2 sm:gap-5">
        Go To Previous Page
      </GoBackLink>
      <ResidentForm
        resident_name={residentData.resident_name}
        document_id={residentData.id}
        facility_id={residentData.facility_id}
        emergency_contacts={residentData.emergency_contacts}
      />
    </main>
  )
}
