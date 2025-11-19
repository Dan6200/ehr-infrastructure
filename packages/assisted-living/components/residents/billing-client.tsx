'use client'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Account,
  Charge,
  Claim,
  Payment,
  Adjustment,
  Coverage,
} from '#/types/schemas'
import { Badge } from '#/components/ui/badge'

type BillingClientProps = {
  accounts: Account[]
  charges: Charge[]
  claims: Claim[]
  payments: Payment[]
  adjustments: Adjustment[]
  coverages: Coverage[]
}

function formatCurrency(amount: number, currency: string = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function BillingClient({
  accounts,
  charges,
  claims,
  payments,
  adjustments,
  coverages,
}: BillingClientProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Accounts Section */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account ID</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell>{acc.id}</TableCell>
                  <TableCell>
                    {formatCurrency(acc.balance.value, acc.balance.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge>{acc.billing_status.coding[0].display}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(acc.authored_on).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charges Section */}
      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>{charge.service}</TableCell>
                  <TableCell>
                    {formatCurrency(
                      charge.unit_price.value * charge.quantity,
                      charge.unit_price.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(charge.occurrence_datetime).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Claims Section */}
      <Card>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>{claim.id}</TableCell>
                  <TableCell>
                    {formatCurrency(claim.total.value, claim.total.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge>{claim.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Payor</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {formatCurrency(
                      payment.amount.value,
                      payment.amount.currency,
                    )}
                  </TableCell>
                  <TableCell>{payment.payor}</TableCell>
                  <TableCell>
                    {new Date(payment.occurrence_datetime).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjustments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell>{adj.reason}</TableCell>
                  <TableCell>
                    {formatCurrency(
                      adj.approved_amount.value,
                      adj.approved_amount.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(adj.authored_on).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
