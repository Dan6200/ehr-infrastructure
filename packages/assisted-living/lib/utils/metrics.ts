import { Resident } from '#root/types'

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100.0 : 0.0
  }
  if (current === 0 && previous > 0) {
    return -100.0
  }
  return ((current - previous) / previous) * 100
}

export function calculateMetrics(
  data: any[],
  timeRange: string,
  residents: Resident[],
) {
  // --- Date Range Calculation ---
  const now = new Date()
  let daysToSubtract = 90
  if (timeRange === '365d') daysToSubtract = 365
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

  // --- Financial Metrics Calculation ---
  const sum = (d: any[], key: string) =>
    d.reduce((acc, item) => acc + parseFloat(item[key]), 0)

  const currentCharges = sum(currentPeriodData, 'charges')
  const previousCharges = sum(previousPeriodData, 'charges')
  const chargesChange = calculatePercentageChange(
    currentCharges,
    previousCharges,
  )

  const currentPayments = sum(currentPeriodData, 'payments')
  const previousPayments = sum(previousPeriodData, 'payments')
  const paymentsChange = calculatePercentageChange(
    currentPayments,
    previousPayments,
  )

  const currentAdjustments = sum(currentPeriodData, 'adjustments')
  const previousAdjustments = sum(previousPeriodData, 'adjustments')
  const adjustmentsChange = calculatePercentageChange(
    currentAdjustments,
    previousAdjustments,
  )

  const currentClaims = sum(currentPeriodData, 'claims')
  const previousClaims = sum(previousPeriodData, 'claims')
  const claimsChange = calculatePercentageChange(currentClaims, previousClaims)

  // --- Growth Metrics Calculation ---
  const filterResidentsByDate = (res: Resident[], start: Date, end: Date) => {
    return res.filter((resident) => {
      if (!resident.created_at) return false
      const residentDate = new Date(resident.created_at)
      return residentDate >= start && residentDate <= end
    })
  }

  const currentPeriodResidents = filterResidentsByDate(
    residents,
    startDate,
    endDate,
  )
  const previousPeriodResidents = filterResidentsByDate(
    residents,
    prevStartDate,
    prevEndDate,
  )

  const currentPeriodCount = currentPeriodResidents.length
  const previousPeriodCount = previousPeriodResidents.length
  const growthRate = calculatePercentageChange(
    currentPeriodCount,
    previousPeriodCount,
  )

  return {
    charges: { amount: currentCharges, change: chargesChange },
    payments: { amount: currentPayments, change: paymentsChange },
    adjustments: { amount: currentAdjustments, change: adjustmentsChange },
    claims: { amount: currentClaims, change: claimsChange },
    growth: { amount: currentPeriodCount, change: growthRate },
    currency:
      currentPeriodData.length > 0 ? currentPeriodData[0].currency : 'NGN',
  }
}
