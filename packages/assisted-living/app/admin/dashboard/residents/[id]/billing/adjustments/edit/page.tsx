import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { AdjustmentsForm } from '#root/components/residents/form/adjustments-form'
import { verifySession } from '#root/auth/server/definitions'
import { notFound } from 'next/navigation'

export default async function EditAdjustmentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const adjustments = await getNestedResidentData(
    provider_id,
    residentId,
    'adjustments',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch adjustments: ${e.message}`)
  })

  return (
    <div className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Adjustments</h1>
      </div>
      <AdjustmentsForm
        adjustments={adjustments || []}
        residentId={residentId}
      />
    </div>
  )
}
