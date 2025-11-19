import { Card, CardFooter, CardHeader } from '#/components/ui/card'
import { PulsingDiv } from '#/components/ui/pulsing-div'

export function SectionCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @[96rem]/main:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <PulsingDiv className="h-4 w-24" />
            <PulsingDiv className="h-8 w-32" />
            <div
              data-slot="card-action"
              className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
            >
              <PulsingDiv className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <PulsingDiv className="h-4 w-3/4" />
            <PulsingDiv className="h-4 w-1/2" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
