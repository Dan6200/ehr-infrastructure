import { getResidentData } from '@/actions/residents/get'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DiagnosticHistory } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function DiagnosticHistoryPage({
  params,
}: {
  params: { id: string }
}) {
  const residentData = await getResidentData(
    params.id,
    'diagnostic_history',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for diagnostic history page: ${e.message}`,
    )
  })

  const { diagnostic_history, id } = residentData

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Diagnostic History</h2>
        <Button asChild>
          <Link
            href={`/admin/dashboard/residents/${id}/diagnostic-history/edit`}
          >
            Edit Diagnostic History
          </Link>
        </Button>
      </div>
      {diagnostic_history && diagnostic_history.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Onset</TableHead>
              <TableHead>Abatement</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type (SNOMED)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recorded Date</TableHead>
              <TableHead>Recorded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnostic_history.map((record, index: number) =>
              record ? (
                <TableRow key={record.id}>
                  <TableCell>{record.onset_datetime ?? 'N/A'}</TableCell>
                  <TableCell>{record.abatement_datetime ?? 'N/A'}</TableCell>
                  <TableCell>{record.title ?? 'N/A'}</TableCell>
                  <TableCell>{record.coding.text ?? 'N/A'}</TableCell>
                  <TableCell>{record.clinical_status}</TableCell>
                  <TableCell>{record.recorded_date}</TableCell>
                  <TableCell>{record.recorder_id}</TableCell>
                </TableRow>
              ) : (
                <TableRow key={index}>
                  <TableCell>Record Does Not Exist</TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      ) : (
        <p>No diagnostic history found for this resident.</p>
      )}
    </div>
  )
}
