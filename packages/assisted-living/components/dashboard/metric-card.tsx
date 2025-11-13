'use client'

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

export const MetricCard = ({
  title,
  metric,
  periodText,
  currency = 'NGN',
  amountType = 'currency',
}: {
  title: string
  metric: { amount: number; change: number }
  periodText: string
  currency?: string
  amountType?: 'currency' | 'percent' | 'decimal'
}) => {
  const isPositive = metric.change >= 0
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: amountType === 'currency' ? 'currency' : 'decimal',
    currency: amountType === 'currency' ? currency : undefined,
    minimumFractionDigits: amountType === 'percent' ? 1 : 0,
    maximumFractionDigits: amountType === 'percent' ? 1 : 0,
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
