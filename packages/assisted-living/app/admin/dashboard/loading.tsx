import { ChartAreaInteractiveSkeleton } from '#root/components/dashboard/chart-area-interactive-skeleton'
import { SectionCardsSkeleton } from '#root/components/dashboard/section-cards-skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <SectionCardsSkeleton />
      <div className="@5xl/main:col-span-2">
        <ChartAreaInteractiveSkeleton />
      </div>
    </div>
  )
}
