import { getNestedResidentData } from '#root/actions/residents/get'
import { CarePlanClient } from '#root/components/residents/care-plan-client'
import { verifySession } from '#root/auth/server/definitions'

type CarePlanPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function CarePlanPage({ params }: CarePlanPageProps) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const [carePlans, goals] = await Promise.all([
    getNestedResidentData(provider_id, residentId, 'care_plans'),
    getNestedResidentData(provider_id, residentId, 'goals'),
  ])

  return (
    <div className="space-y-4">
      <CarePlanClient carePlans={carePlans || []} goals={goals || []} />
    </div>
  )
}
