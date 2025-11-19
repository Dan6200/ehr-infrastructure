import { PulsingDiv } from '#root/components/ui/pulsing-div'

export function ResidentInfoSkeleton() {
  return (
    <article className="grid grid-cols-1 gap-x-8 gap-y-4 pt-4 md:grid-cols-2">
      <div className="md:col-span-2 mb-8 pb-2">
        <PulsingDiv className="h-8 w-64 mx-auto" />
      </div>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <PulsingDiv className="h-5 w-24" />
          <PulsingDiv className="h-5 w-48" />
        </div>
      ))}
    </article>
  )
}
