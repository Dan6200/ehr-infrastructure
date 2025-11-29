import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { ObservationsForm } from '#root/components/residents/form/observations-form'
import { notFound } from 'next/navigation'
import { verifySession } from '#root/auth/server/definitions'

export default async function EditObservationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const observations = await getNestedResidentData(
    provider_id,
    residentId,
    'observations',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch resident data for edit page: ${e.message}`)
  })

  return (
    <div className="py-8">
      <ObservationsForm
        observations={observations || []}
        residentId={residentId}
      />
    </div>
  )
}
