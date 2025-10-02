import { GoBackLink } from '@/components/go-back-link'
import { ResidentForm } from '@/components/residents/form'
import { getResidentData } from '../../actions/get'

export default async function EditResidentPage({
  params: { resId },
}: {
  params: { resId: string }
}) {
  const residentData = await getResidentData(resId)

  // Ensure document_id and resident_id are present for edit mode
  if (!residentData.document_id || !residentData.resident_id) {
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
        encrypted_resident_name={residentData.encrypted_resident_name}
        document_id={residentData.document_id}
        resident_id={residentData.resident_id}
        facility_id={residentData.facility_id}
        emergencyContacts={residentData.emergencyContacts}
      />
    </main>
  )
}
