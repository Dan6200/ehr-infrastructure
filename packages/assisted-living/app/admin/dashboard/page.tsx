'use server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '#/components/dashboard/dashboard-client'
import bigqueryClient from '#/lib/bigquery'
import {
  getFinancialSummaryQuery,
  getResidentGrowthQuery,
} from '#/lib/bigquery/queries'
import { Resident } from '#/types'

export type FormattedChartData = {
  date: string
  currency: string
  charges: number
  claims: number
  payments: number
  adjustments: number
}[]

async function getChartData(): Promise<{
  chartData: FormattedChartData
  residents: Pick<Resident, 'created_at'>[]
} | null> {
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

    // The financialRows are already in the correct format due to the SQL query
    const chartData: FormattedChartData = financialRows

    // The growthRows just contain the creation dates
    const residents = growthRows as Pick<Resident, 'created_at'>[]

    return {
      chartData,
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
