import { ResidentSkeleton } from '#/components/resident-skeleton'
import { PulsingDiv } from '#/components/ui/pulsing-div'

export function ResidentLayoutSkeleton() {
  return (
    <main className="bg-background flex flex-col items-start gap-2 container md:px-4 text-center h-fit">
      <ResidentSkeleton />
      {/* Skeleton for ResidentNav */}
      <div className="flex justify-start w-full gap-4 lg:gap-8 border-b py-2">
        <PulsingDiv className="h-6 w-32 rounded-md" />
        <PulsingDiv className="h-6 w-48 rounded-md" />
        <PulsingDiv className="h-6 w-40 rounded-md" />
        <PulsingDiv className="h-6 w-36 rounded-md" />
      </div>
    </main>
  )
}
