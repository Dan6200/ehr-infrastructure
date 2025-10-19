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
import { Vital } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function VitalsPage({
  params,
}: {
  params: { id: string }
}) {
  const residentData = await getResidentData(params.id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for vitals page: ${e.message}`,
    )
  })

  const { vitals, id } = residentData

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Vitals</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/vitals/edit`}>
            Edit Vitals
          </Link>
        </Button>
      </div>
      {vitals && vitals.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vital (LOINC)</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vitals.map((vital: Vital, index: number) => (
              <TableRow key={index}>
                <TableCell>{vital.date}</TableCell>
                <TableCell>{vital.loinc_code}</TableCell>
                <TableCell>{vital.value}</TableCell>
                <TableCell>{vital.unit || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No vitals recorded for this resident.</p>
      )}
    </div>
  )
}
