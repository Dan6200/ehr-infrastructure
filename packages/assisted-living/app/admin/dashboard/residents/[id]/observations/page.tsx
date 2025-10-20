'use client'
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
import { Observation } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ObservationsPage({
  params,
}: {
  params: { id: string }
}) {
  const residentData = await getResidentData(params.id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for observations page: ${e.message}`,
    )
  })

  const { observations, id } = residentData

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Observations</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/observations/edit`}>
            Edit Observations
          </Link>
        </Button>
      </div>
      {observations && observations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Observation (LOINC)</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {observations.map((observation: Observation, index: number) => (
              <TableRow key={index}>
                <TableCell>{observation.date}</TableCell>
                <TableCell>{observation.loinc_code}</TableCell>
                <TableCell>{observation.value}</TableCell>
                <TableCell>{observation.unit || 'N/A'}</TableCell>
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
