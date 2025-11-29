import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { PaymentsForm } from '#root/components/residents/form/payments-form'
import { verifySession } from '#root/auth/server/definitions'
import { notFound } from 'next/navigation'

export default async function EditPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const payments = await getNestedResidentData(
    provider_id,
    residentId,
    'payments',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(`Unable to fetch payments: ${e.message}`)
  })

  return (
    <div className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Payments</h1>
      </div>
      <PaymentsForm payments={payments || []} residentId={residentId} />
    </div>
  )
}
