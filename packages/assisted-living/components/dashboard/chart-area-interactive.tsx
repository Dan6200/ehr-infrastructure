'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import { useIsMobile } from '#root/hooks/use-mobile'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#root/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#root/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#root/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '#root/components/ui/toggle-group'
import { FormattedChartData } from '#root/app/admin/dashboard/page'

const chartConfig = {
  charges: {
    label: 'Charges',
    color: 'hsl(var(--chart-2))',
  },
  payments: {
    label: 'Payments',
    color: 'hsl(var(--chart-3))',
  },
  adjustments: {
    label: 'Adjustments',
    color: 'hsl(var(--chart-4))',
  },
  claims: {
    label: 'Claims',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  chartData: FormattedChartData
  timeRange: string
  setTimeRange: React.Dispatch<React.SetStateAction<string>>
}

export function ChartAreaInteractive({
  chartData,
  timeRange,
  setTimeRange,
}: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('30d')
    }
  }, [isMobile])

  const filteredData = chartData.filter((item, index) => {
    const date = new Date(`${item.date}T00:00:00`)
    const now = new Date()
    let daysToSubtract = 180
    if (timeRange === '90d') {
      daysToSubtract = 90
    } else if (timeRange === '30d') {
      daysToSubtract = 30
    } else if (timeRange === '365d') {
      daysToSubtract = 365
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    startDate.setHours(0, 0, 0, 0)

    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total charges, payments, and adjustments over the last 3 months.
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="365d">Year-To-Date</ToggleGroupItem>
            <ToggleGroupItem value="180d">Last 6 months</ToggleGroupItem>
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="365d" className="rounded-lg">
                Last year
              </SelectItem>
              <SelectItem value="180d" className="rounded-lg">
                Last 6 months
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="overflow-x-auto scrollbar-hide">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[400px] w-full min-w-[600px]"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillCharges" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-charges)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-charges)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillPayments" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-payments)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-payments)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient
                  id="fillAdjustments"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-adjustments)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-adjustments)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillClaims" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-claims)"
                    stopOpacity={0.7}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-claims)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="payments"
                type="natural"
                fill="url(#fillPayments)"
                stroke="var(--color-payments)"
                stackId="a"
              />
              <Area
                dataKey="charges"
                type="natural"
                fill="url(#fillCharges)"
                stroke="var(--color-charges)"
                stackId="a"
              />
              <Area
                dataKey="adjustments"
                type="natural"
                fill="url(#fillAdjustments)"
                stroke="var(--color-adjustments)"
                stackId="a"
              />
              <Area
                dataKey="claims"
                type="natural"
                fill="url(#fillClaims)"
                stroke="var(--color-claims)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
