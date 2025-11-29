import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { verifySession } from '#root/auth/server/definitions'
import EmergencyContacts from '#root/components/emergency-contacts'
import { Button } from '#root/components/ui/button'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function EmergencyContactsPage({
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
    if (e.message.match(/(insufficient permissions|invalid session)/i))
      redirect('/admin/sign-in')
    throw new Error(
      `Unable to fetch resident data for contacts page -- Tag:EC1.\n\t${e.message}`,
    )
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center pb-2 mb-8">
        <h2 className="text-xl font-semibold">Emergency Contacts</h2>
        <Button asChild>
          <Link
            href={`/admin/dashboard/residents/${id}/emergency-contacts/edit`}
          >
            Edit Contacts
          </Link>
        </Button>
      </div>
      <EmergencyContacts contacts={emergency_contacts || []} />
    </div>
  )
}
