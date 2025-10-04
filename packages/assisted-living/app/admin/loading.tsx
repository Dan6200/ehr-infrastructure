import { PulsingDiv } from '@/components/ui/pulsing-div'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function Loading() {
  return (
    <main className="sm:container bg-background text-center mx-auto py-48 md:py-32">
      <div className="w-fit rounded-md border-2 mx-auto">
        <Table className="text-base w-[90vw] md:w-[70vw] lg:w-[50vw]">
          <TableCaption>All Residents.</TableCaption>
          <TableHeader className="bg-foreground/20 font-bold rounded-md">
            <TableRow>
              <TableHead className="text-center w-[1vw]">Room Number</TableHead>
              <TableHead className="text-center w-[2vw]">Resident</TableHead>
              <TableHead className="text-center w-[10vw]">
                Facility Address
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(25)
              .fill(null)
              .map((_data: null, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">
                    <PulsingDiv className="h-5 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <PulsingDiv className="h-5 w-32 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <PulsingDiv className="h-5 w-48 mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
