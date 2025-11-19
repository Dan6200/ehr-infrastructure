import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { PulsingDiv } from './ui/pulsing-div'

export default function ResidentListSkeleton() {
  return (
    <main className="sm:container bg-background text-left mx-auto py-48 md:py-32">
      <div className="w-full rounded-lg overflow-hidden md:w-3/5 shadow-md mx-auto">
        <Table className="text-base w-fit sm:w-full overflow-x-scroll">
          <TableCaption>All Residents.</TableCaption>
          <TableHeader className="bg-foreground/20 font-bold rounded-md">
            <TableRow>
              <TableHead className="text-left">Room</TableHead>
              <TableHead className="text-left">Resident</TableHead>
              <TableHead className="text-left">Facility Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(25)
              .fill(null)
              .map((_data: null, index) => (
                <TableRow key={index}>
                  <TableCell className="text-left">
                    <PulsingDiv className="h-5 w-12" />
                  </TableCell>
                  <TableCell className="text-left">
                    <PulsingDiv className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="text-left">
                    <PulsingDiv className="h-5 w-48" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
