import { PulsingDiv } from '#/components/ui/pulsing-div'

export function ResidentSkeleton() {
  return (
    <div className="py-2 md:py-4 w-full lg:w-2/3">
      <div className="flex flex-col md:flex-row items-center self-center gap-4 md:gap-8">
        <PulsingDiv className="h-32 w-32 rounded-full" />
        <span className="flex gap-2">
          <PulsingDiv className="h-9 w-32" />
          <PulsingDiv className="h-9 w-32" />
        </span>
      </div>
    </div>
  )
}
