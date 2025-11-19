import { Card, CardContent, CardHeader } from '#root/components/ui/card'
import { PulsingDiv } from '#root/components/ui/pulsing-div'

export function ChartAreaInteractiveSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <PulsingDiv className="h-6 w-32" />
        <PulsingDiv className="h-4 w-48" />
        <div
          data-slot="card-action"
          className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
        >
          <PulsingDiv className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <PulsingDiv className="aspect-auto h-[400px] w-full" />
      </CardContent>
    </Card>
  )
}
