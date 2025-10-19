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
import { FinancialTransaction } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BillingPage({
  params,
}: {
  params: { id: string }
}) {
  const residentData = await getResidentData(params.id).catch((e) => {
    if (e.message.match(/not_found/i)) notFound()
    throw new Error(
      `Unable to fetch resident data for billing page: ${e.message}`,
    )
  })

  const { financials, id } = residentData

  const totalBalance =
    financials?.reduce((acc, transaction) => {
      return transaction.type === 'CHARGE'
        ? acc + transaction.amount
        : acc - transaction.amount
    }, 0) || 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b pb-2 mb-8">
        <h2 className="text-xl font-semibold">Billing & Financials</h2>
        <Button asChild>
          <Link href={`/admin/dashboard/residents/${id}/billing/edit`}>
            Edit Financials
          </Link>
        </Button>
      </div>
      <div className="text-lg font-bold">
        Current Balance: ${totalBalance.toFixed(2)}
      </div>
      {financials && financials.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financials.map((item: FinancialTransaction, index: number) => (
              <TableRow key={index}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell
                  className={`text-right ${item.type === 'CHARGE' ? 'text-red-500' : 'text-green-500'}`}
                >
                  {item.type === 'CHARGE' ? '+' : '-'}${item.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No financial records for this resident.</p>
      )}
    </div>
  )
}
