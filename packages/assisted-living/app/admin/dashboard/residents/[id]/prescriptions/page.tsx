import { getNestedResidentData } from '#root/actions/residents/get/subcollections'
import { verifySession } from '#root/auth/server/definitions'
import { Button } from '#root/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#root/components/ui/table'
import { Prescription } from '#root/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: residentId } = await params
  const { provider_id } = await verifySession()

  const prescriptions = await getNestedResidentData(
    provider_id,
    residentId,
    'prescriptions',
  ).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for prescriptions page: ${e.message}`,
    )
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Prescriptions</h2>
        <Button asChild>
          <Link
            href={`/admin/dashboard/residents/${residentId}/prescriptions/edit`}
          >
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
                  <TableCell>
                    {med.medication?.code?.text ||
                      med.medication?.code?.coding?.[0]?.display ||
                      'N/A'}
                  </TableCell>
                  <TableCell>
                    {med.dosage_instruction?.[0]?.timing?.code?.coding?.[0]
                      ?.display || 'N/A'}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={index}>
                  <TableCell colSpan={2}>
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
