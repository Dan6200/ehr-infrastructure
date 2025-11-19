import { getNestedResidentData } from '#/actions/residents/get'
import { BillingClient } from '#/components/residents/billing-client'
import {
  Account,
  Charge,
  Claim,
  Payment,
  Adjustment,
  Coverage,
} from '#/types/schemas'

type BillingPageProps = {
  params: {
    residentId: string
  }
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { residentId } = params

  const [accounts, charges, claims, payments, adjustments, coverages] =
    await Promise.all([
      getNestedResidentData(residentId, 'accounts'),
      getNestedResidentData(residentId, 'charges'),
      getNestedResidentData(residentId, 'claims'),
      getNestedResidentData(residentId, 'payments'),
      getNestedResidentData(residentId, 'adjustments'),
      getNestedResidentData(residentId, 'coverages'),
    ])

  return (
    <div className="space-y-4">
      <BillingClient
        accounts={accounts as Account[]}
        charges={charges as Charge[]}
        claims={claims as Claim[]}
        payments={payments as Payment[]}
        adjustments={adjustments as Adjustment[]}
        coverages={coverages as Coverage[]}
      />
    </div>
  )
}
