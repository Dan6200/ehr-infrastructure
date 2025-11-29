import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { verifySession } from '#root/auth/server/definitions'
import { EmergencyContactsFormEdit } from '#root/components/residents/form/EmergencyContactsFormEdit'
import { notFound } from 'next/navigation'

export default async function EditEmergencyContactsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { provider_id } = await verifySession()

  const emergency_contacts = await getNestedResidentData(
    provider_id,
    id,
    'emergency_contacts',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch resident data for edit page: ${e.message}`)
  })

  return (
    <div className="py-8 mx-auto">
      <EmergencyContactsFormEdit
        documentId={id}
        initialContacts={emergency_contacts || []}
      />
    </div>
  )
}
