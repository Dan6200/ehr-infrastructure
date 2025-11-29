import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { AllergiesForm } from '#root/components/residents/form/allergies-form'
import { notFound } from 'next/navigation'
import { verifySession } from '#root/auth/server/definitions'

export default async function EditAllergiesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const allergies = await getNestedResidentData(
    provider_id,
    residentId,
    'allergies',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch resident data for edit page: ${e.message}`)
  })

  return (
    <div className="py-8">
      <AllergiesForm allergies={allergies || []} residentId={residentId} />
    </div>
  )
}
