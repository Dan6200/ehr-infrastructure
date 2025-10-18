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
import { Allergy } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AllergiesPage({
  params,
}: {
  params: { id: string }
}) {
  const residentData = await getResidentData(params.id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for allergies page: ${e.message}`,
    )
  })

  const { allergies, id } = residentData

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Allergies</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/allergies/edit`}>
            Edit Allergies
          </Link>
        </Button>
      </div>
      {allergies && allergies.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allergy</TableHead>
              <TableHead>Reaction</TableHead>
              <TableHead>SNOMED Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allergies.map((allergy: Allergy, index: number) => (
              <TableRow key={index}>
                <TableCell>{allergy.name}</TableCell>
                <TableCell>{allergy.reaction || 'N/A'}</TableCell>
                <TableCell>{allergy.snomed_code || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No allergies recorded for this resident.</p>
      )}
    </div>
  )
}
