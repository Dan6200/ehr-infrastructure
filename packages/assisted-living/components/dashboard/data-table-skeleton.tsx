import { PulsingDiv } from '@/components/ui/pulsing-div'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function DataTableSkeleton() {
  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-2 lg:px-6">
        <PulsingDiv className="h-9 w-24" />
        <div className="flex items-center gap-2">
          <PulsingDiv className="h-9 w-28" />
          <PulsingDiv className="h-9 w-28" />
        </div>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto lg:px-6 mt-4">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <PulsingDiv className="h-5 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <PulsingDiv className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <PulsingDiv className="h-5 w-32" />
          <div className="flex items-center gap-2">
            <PulsingDiv className="h-8 w-20" />
            <PulsingDiv className="h-8 w-20" />
            <PulsingDiv className="h-8 w-8" />
            <PulsingDiv className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
