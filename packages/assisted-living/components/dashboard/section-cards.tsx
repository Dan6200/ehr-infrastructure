'use client'

import * as React from 'react'
import { Resident } from '#/types'
import { calculateMetrics } from '#/lib/utils/metrics'
import { MetricCard } from './metric-card'

interface SectionCardsProps {
  chartData: any[]
  timeRange: string
  residents: Resident[]
}

export function SectionCards({
  chartData,
  timeRange,
  residents,
}: SectionCardsProps) {
  const metrics = calculateMetrics(chartData, timeRange, residents)
  const periodText = `this ${timeRange === '30d' ? 'month' : timeRange === '90d' ? 'quarter' : timeRange === '180d' ? '6 months' : 'year'}`

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @[96rem]/main:grid-cols-4">
      <MetricCard
        title="Total Charges"
        metric={metrics.charges}
        periodText={periodText}
        currency={metrics.currency}
      />
      <MetricCard
        title="Total Payments"
        metric={metrics.payments}
        periodText={periodText}
        currency={metrics.currency}
      />
      <MetricCard
        title="Total Adjustments"
        metric={metrics.adjustments}
        periodText={periodText}
        currency={metrics.currency}
      />
      <MetricCard
        title="Total Claims"
        metric={metrics.claims}
        periodText={periodText}
        currency={metrics.currency}
      />
      <MetricCard
        title="New Residents"
        metric={metrics.growth}
        periodText={periodText}
        amountType="decimal"
      />
    </div>
  )
}
