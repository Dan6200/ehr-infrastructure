'use server'
import { getAllResidents, getNestedResidentData } from '@/actions/residents/get'
import { FinancialTransaction } from '@/types'
import { redirect } from 'next/navigation'
// import { DashboardClient } from '@/components/dashboard/dashboard-client'

async function getChartData() {
  const { residents } =
    (await getAllResidents({}).catch(async (reason) => {
      if (reason.toString().match(/(cookies|session|authenticate)/i)) {
        await fetch(`${process.env.URL}:${process.env.PORT}/api/auth/logout`, {
          method: 'post',
        }).then(async (result) => {
          if (result.status === 200) redirect('/sign-in') // Navigate to the login page
        })
      }
    })) || {}

  if (!residents) return null

  const residentFinancials = await Promise.all(
    residents.map((r) => getNestedResidentData(r.id, 'financials') || []),
  )

  const allTransactions = residentFinancials.flat()

  // Aggregate data by date
  const aggregatedData = allTransactions.reduce(
    (
      acc: {
        [key: string]: {
          date: string
          charges: number
          payments: number
          adjustments: number
        }
      },
      item: FinancialTransaction,
    ) => {
      const date = item.occurrence_datetime.split('T')[0] // Group by day
      if (!acc[date]) {
        acc[date] = { date, charges: 0, payments: 0, adjustments: 0 }
      }
      if (item.type === 'CHARGE') {
        acc[date].charges += item.amount
      } else if (item.type === 'PAYMENT') {
        acc[date].payments += item.amount
      } else {
        acc[date].adjustments += item.amount
      }
      return acc
    },
    {},
  )

  const formattedData = Object.values(aggregatedData).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return formattedData
}

export default async function DashboardPage() {
  const chartData = await getChartData()
  return (
    <ul>
      {chartData.map((data) => (
        <li>{data?.payment}</li>
      ))}
    </ul>
  )
  // return <DashboardClient chartData={chartData} />
}
