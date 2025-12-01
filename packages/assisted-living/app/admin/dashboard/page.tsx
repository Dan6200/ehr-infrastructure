import { redirect } from 'next/navigation'
import { DashboardClient } from '#root/components/dashboard/dashboard-client'
import { bigqueryClient } from '#root/lib/bigquery'
import {
  getFinancialSummaryQuery,
  getResidentGrowthQuery,
} from '#root/lib/bigquery/queries'
import { Resident } from '#root/types/schemas/administrative/resident'

import { FormattedChartData } from '#root/types/dashboard'

export const dynamic = 'force-dynamic'

async function getChartData(): Promise<{
  chartData: FormattedChartData
  residents: Pick<Resident, 'created_at' | 'deactivated_at'>[]
} | null> {
  'use server'
  try {
    const financialQueryOptions = {
      query: getFinancialSummaryQuery,
      location: 'EU', // Updated to EU as per your .env file
    }
    const growthQueryOptions = {
      query: getResidentGrowthQuery,
      location: 'EU', // Updated to EU as per your .env file
    }

    // Run the queries in parallel
    const [[financialRows], [growthRows]] = await Promise.all([
      bigqueryClient.query(financialQueryOptions),
      bigqueryClient.query(growthQueryOptions),
    ])

    // Convert BigQuery's custom types (BigQueryNumeric, BigQueryDate) to standard JS types
    const chartData: FormattedChartData = financialRows.map((row: any) => ({
      date: row.date,
      currency: row.currency,
      charges: row.charges.toNumber(),
      claims: row.claims.toNumber(),
      payments: row.payments.toNumber(),
      adjustments: row.adjustments.toNumber(),
    }))

    // Filter out any data points from the future
    const today = new Date()
    const filteredChartData = chartData.filter(
      (item) => new Date(item.date) <= today,
    )

    // The growthRows contain BigQuery DATE objects, which need to be parsed
    const residents = growthRows.map(
      (row: {
        created_at: { value: string }
        deactivated_at: { value: string } | null
      }) => ({
        created_at: row.created_at.value,
        deactivated_at: row.deactivated_at ? row.deactivated_at.value : null,
      }),
    ) as Pick<Resident, 'created_at' | 'deactivated_at'>[]

    return {
      chartData: filteredChartData,
      residents,
    }
  } catch (error) {
    console.error('BigQuery query failed:', error)
    // More specific error handling can be added here
    if (error instanceof Error && error.message.match(/(denied|invalid)/i)) {
      redirect('/sign-in')
    }
    return null
  }
}

export default async function DashboardPage() {
  const data = await getChartData()
  if (!data) return <div>Error loading dashboard data from BigQuery.</div>
  return (
    <DashboardClient chartData={data.chartData} residents={data.residents} />
  )
}
