import { getNestedResidentData } from '#root/actions/residents/get'
import { BillingClient } from '#root/components/residents/billing-client'
import { verifySession } from '#root/auth/server/definitions'

type BillingPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const [accounts, charges, claims, payments, adjustments, coverages] =
    await Promise.all([
      getNestedResidentData(provider_id, residentId, 'accounts'),
      getNestedResidentData(provider_id, residentId, 'charges'),
      getNestedResidentData(provider_id, residentId, 'claims'),
      getNestedResidentData(provider_id, residentId, 'payments'),
      getNestedResidentData(provider_id, residentId, 'adjustments'),
      getNestedResidentData(provider_id, residentId, 'coverages'),
    ])

  return (
    <div className="space-y-4">
      <BillingClient
        residentId={residentId}
        accounts={accounts || []}
        charges={charges || []}
        claims={claims || []}
        payments={payments || []}
        adjustments={adjustments || []}
        coverages={coverages || []}
      />
    </div>
  )
}
