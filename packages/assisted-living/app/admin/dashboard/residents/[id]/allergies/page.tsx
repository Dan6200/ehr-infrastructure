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
import { Allergy } from '#root/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AllergiesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const residentData = await getResidentData(id, 'allergies').catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for allergies page: ${e.message}`,
    )
  })

  const { allergies } = residentData

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <h2 className="text-xl font-semibold">Allergies</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/allergies/edit`}>
            Edit Allergies
          </Link>
        </Button>
      </div>
      {allergies && allergies.length > 0 ? (
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead>Allergy</TableHead>
              <TableHead>Reaction</TableHead>
              <TableHead>Reaction Severity</TableHead>
              <TableHead>Allergen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allergies.map((allergy: Allergy) =>
              allergy ? (
                <TableRow key={allergy.id}>
                  <TableCell className="text-left text-destructive">
                    {allergy.name.text ?? 'N/A'}
                  </TableCell>
                  <TableCell className="text-left">
                    {allergy.reaction.code.text ?? 'N/A'}
                  </TableCell>
                  <TableCell className="text-left">
                    {allergy.reaction.severity ?? 'N/A'}
                  </TableCell>
                  <TableCell className="text-left">
                    {allergy.substance.text ?? 'N/A'}
                  </TableCell>
                </TableRow>
              ) : null,
            )}
          </TableBody>
        </Table>
      ) : (
        <p>No allergies recorded for this resident.</p>
      )}
    </div>
  )
}
