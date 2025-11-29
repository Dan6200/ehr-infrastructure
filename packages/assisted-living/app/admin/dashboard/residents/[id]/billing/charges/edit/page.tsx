import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { ChargesForm } from '#root/components/residents/form/charges-form'
import { verifySession } from '#root/auth/server/definitions'
import { notFound } from 'next/navigation'

export default async function EditChargesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const charges = await getNestedResidentData(
    provider_id,
    residentId,
    'charges',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch charges: ${e.message}`)
  })

  return (
    <div className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Charges</h1>
      </div>
      <ChargesForm charges={charges || []} residentId={residentId} />
    </div>
  )
}
