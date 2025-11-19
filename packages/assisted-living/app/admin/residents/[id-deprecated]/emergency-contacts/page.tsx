import { notFound, redirect } from 'next/navigation'
import { getResidentData } from '#/actions/residents/get'
import EmergencyContacts from '#/components/emergency-contacts'

export default async function EmergencyContactsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const residentData = await getResidentData(id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    if (e.message.match(/insufficient permissions/)) redirect('/admin/sign-in')
    throw new Error(
      `Unable to fetch resident data for contacts page -- Tag:EC1.\n\t${e.message}`,
    )
  })

  return <EmergencyContacts contacts={residentData.emergency_contacts} />
}
