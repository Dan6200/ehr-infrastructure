import { getResidentData } from '#root/actions/residents/get'
import { EmergencyContactsFormEdit } from '#root/components/residents/form/EmergencyContactsFormEdit'
import { notFound } from 'next/navigation'

export default async function EditEmergencyContactsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch resident data for edit page: ${e.message}`)
  })

  const { emergency_contacts } = residentData
  return (
    <div className="py-8 mx-auto">
      <EmergencyContactsFormEdit
        documentId={id}
        initialContacts={emergency_contacts}
      />
    </div>
  )
}
