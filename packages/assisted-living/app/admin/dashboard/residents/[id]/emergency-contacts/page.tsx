import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '@/actions/residents/get'
import EmergencyContacts from '@/components/emergency-contacts'
import { EditEmergencyContactsDialog } from '@/components/dashboard/residents/edit-emergency-contacts-dialog'

export default async function EmergencyContactsPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    if (e.message.match(/insufficient permissions/)) redirect('/admin/sign-in')
    throw new Error(
      `Unable to fetch resident data for contacts page -- Tag:EC1.\n\t${e.message}`,
    )
  })

  return (
    <div className="space-y-8">
      <div className="md:col-span-2 flex justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Emergency Contacts</h2>
        <EditEmergencyContactsDialog
          documentId={id}
          contacts={residentData.emergency_contacts}
        />
      </div>
      <EmergencyContacts contacts={residentData.emergency_contacts} />
    </div>
  )
}
