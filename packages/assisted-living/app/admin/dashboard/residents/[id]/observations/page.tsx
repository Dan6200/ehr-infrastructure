import { getResidentData } from '#root/actions/residents/get'
import { Button } from '#root/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#root/components/ui/table'
import { Observation } from '#root/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ObservationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params

  const residentData = await getResidentData(residentId, 'observations').catch(
    (e) => {
      if (e.message.match(/not_found/i)) notFound()
      throw new Error(
        `Unable to fetch resident data for observations page: ${e.message}`,
      )
    },
  )

  const observations = residentData.observations || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Observations</h2>
        <Button asChild>
          <Link
            href={`/admin/dashboard/residents/${residentId}/observations/edit`}
          >
            Edit Observations
          </Link>
        </Button>
      </div>
      {observations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Observation</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {observations.map((observation: Observation) => (
              <TableRow key={observation.id}>
                <TableCell>
                  {new Date(
                    observation.effective_datetime,
                  ).toLocaleDateString()}
                </TableCell>
                <TableCell>{observation.code.text}</TableCell>
                <TableCell>{observation.value_quantity.value}</TableCell>
                <TableCell>
                  {observation.value_quantity.unit || 'N/A'}
                </TableCell>
                <TableCell>{observation.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No observations recorded for this resident.</p>
      )}
    </div>
  )
}
