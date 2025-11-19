import { getResidentData } from '#/actions/residents/get'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Prescription } from '#/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const residentData = await getResidentData(
    (await params).id,
    'prescriptions',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for prescriptions page: ${e.message}`,
    )
  })

  const { prescriptions, id } = residentData

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Prescriptions</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/prescriptions/edit`}>
            Edit Prescriptions
          </Link>
        </Button>
      </div>
      {prescriptions && prescriptions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prescription</TableHead>
              <TableHead>Dosage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((med: Prescription, index: number) =>
              med ? (
                <TableRow key={med.id}>
                  <TableCell>{med.medication.code.text}</TableCell>
                  <TableCell>
                    {med.dosage_instruction[0].timing.code.coding[0]?.display ||
                      'N/A'}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={index}>
                  <TableCell>
                    No Medications On Record for Resident...
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      ) : (
        <p>No prescriptions recorded for this resident.</p>
      )}
    </div>
  )
}
