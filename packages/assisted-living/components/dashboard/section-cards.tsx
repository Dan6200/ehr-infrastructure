'use client'

import * as React from 'react'
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface SectionCardsProps {
  chartData: any[]
  timeRange: string
}

function calculateMetrics(data: any[], timeRange: string) {
  const now = new Date()
  let daysToSubtract = 90
  if (timeRange === '180d') daysToSubtract = 180
  if (timeRange === '30d') daysToSubtract = 30

  const endDate = now
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - daysToSubtract)

  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(prevEndDate.getDate() - 1)
  const prevStartDate = new Date(prevEndDate)
  prevStartDate.setDate(prevStartDate.getDate() - daysToSubtract)

  const filterDataByDate = (d: any[], start: Date, end: Date) => {
    return d.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= start && itemDate <= end
    })
  }

  const currentPeriodData = filterDataByDate(data, startDate, endDate)
  const previousPeriodData = filterDataByDate(data, prevStartDate, prevEndDate)

  const sum = (d: any[], key: string) =>
    d.reduce((acc, item) => acc + item[key], 0)

  const currentTotal = sum(currentPeriodData, 'total')
  const previousTotal = sum(previousPeriodData, 'total')
  const totalsChange =
    previousTotal === 0
      ? 100
      : ((currentTotal - previousTotal) / previousTotal) * 100

  const currentCharges = sum(currentPeriodData, 'charges')
  const previousCharges = sum(previousPeriodData, 'charges')
  const chargesChange =
    previousCharges === 0
      ? 100
      : ((currentCharges - previousCharges) / previousCharges) * 100

  const currentPayments = sum(currentPeriodData, 'payments')
  const previousPayments = sum(previousPeriodData, 'payments')
  const paymentsChange =
    previousPayments === 0
      ? 100
      : ((currentPayments - previousPayments) / previousPayments) * 100

  const currentAdjustments = sum(currentPeriodData, 'adjustments')
  const previousAdjustments = sum(previousPeriodData, 'adjustments')
  const adjustmentsChange =
    previousAdjustments === 0
      ? 100
      : ((currentAdjustments - previousAdjustments) / previousAdjustments) * 100

  return {
    revenue: { amount: currentTotal, change: totalsChange },
    charges: { amount: currentCharges, change: chargesChange },
    payments: { amount: currentPayments, change: paymentsChange },
    adjustments: { amount: currentAdjustments, change: adjustmentsChange },
  }
}

const MetricCard = ({
  title,
  metric,
  periodText,
  amountType = 'currency',
}: {
  title: string
  metric: { amount: number; change: number }
  periodText: string
  amountType?: 'currency' | 'percent'
}) => {
  const isPositive = metric.change >= 0
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: amountType,
    currency: amountType === 'currency' ? 'USD' : undefined,
    minimumFractionDigits: amountType === 'percent' ? 1 : 2,
    maximumFractionDigits: amountType === 'percent' ? 1 : 2,
  }).format(metric.amount)
  const formattedChange = `${isPositive ? '+' : ''}${metric.change.toFixed(1)}%`

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formattedAmount}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            {isPositive ? (
              <IconTrendingUp className="size-6 text-success" />
            ) : (
              <IconTrendingDown className="size-6 text-destructive" />
            )}
            <span className={isPositive ? 'text-success' : 'text-destructive'}>
              {formattedChange}
            </span>
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div
          className={`line-clamp-1 flex items-center gap-2 font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}
        >
          {isPositive ? 'Trending up' : 'Trending down'} {periodText}
          {isPositive ? (
            <IconTrendingUp className="size-4 text-success" />
          ) : (
            <IconTrendingDown className="size-4 text-destructive" />
          )}
        </div>
        <div className="text-muted-foreground">
          Compared to the previous {periodText.split(' ').pop()}
        </div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards({ chartData, timeRange }: SectionCardsProps) {
  const metrics = calculateMetrics(chartData, timeRange)
  const periodText = `this ${timeRange === '30d' ? 'month' : timeRange === '90d' ? 'quarter' : '6 months'}`

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 @7xl/main:grid-cols-4">
      <MetricCard
        title="Total Revenue"
        metric={metrics.revenue}
        periodText={periodText}
      />
      <MetricCard
        title="Total Charges"
        metric={metrics.charges}
        periodText={periodText}
      />
      <MetricCard
        title="Total Payments"
        metric={metrics.payments}
        periodText={periodText}
      />
      <MetricCard
        title="Total Adjustments"
        metric={metrics.adjustments}
        periodText={periodText}
      />
      {/* <MetricCard
        title="Growth Rate"
        metric={{ amount: metrics.revenue.change, change: metrics.revenue.change }}
        periodText={periodText}
        amountType="percentage"
      /> */}
    </div>
  )
}
