import { getNestedResidentData } from '#root/actions/residents/get'
import { CarePlanClient } from '#root/components/residents/care-plan-client'
import { CarePlan, Goal } from '#root/types/schemas'

type CarePlanPageProps = {
  params: {
    residentId: string
  }
}

export default async function CarePlanPage({ params }: CarePlanPageProps) {
  const { residentId } = params

  const [carePlans, goals] = await Promise.all([
    getNestedResidentData(residentId, 'care_plans'),
    getNestedResidentData(residentId, 'goals'),
  ])

  return (
    <div className="space-y-4">
      <CarePlanClient
        carePlans={carePlans as CarePlan[]}
        goals={goals as Goal[]}
      />
    </div>
  )
}
