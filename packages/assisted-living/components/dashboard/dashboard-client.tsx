'use client'

import * as React from 'react'
import { ChartAreaInteractive } from '#root/components/dashboard/chart-area-interactive'
import { SectionCards } from '#root/components/dashboard/section-cards'
import { FormattedChartData } from '#root/types/dashboard'
import { Resident } from '#root/types/schemas/administrative/resident'

export function DashboardClient({
  chartData,
  residents,
}: {
  chartData: FormattedChartData
  residents: Pick<Resident, 'created_at' | 'deactivated_at'>[]
}) {
  const [timeRange, setTimeRange] = React.useState('90d')

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <SectionCards
        chartData={chartData}
        timeRange={timeRange}
        residents={residents}
      />
      <div className="@5xl/main:col-span-2">
        <ChartAreaInteractive
          chartData={chartData}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />
      </div>
    </div>
  )
}
