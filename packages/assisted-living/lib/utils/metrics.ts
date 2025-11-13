import { Resident } from '@/types'

export function calculateMetrics(
  data: any[],
  timeRange: string,
  residents: Resident[],
) {
  // --- Financial Metrics Calculation ---
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

  const sum = (d: any[], key: string) =>
    d.reduce((acc, item) => acc + item[key], 0)

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

  const currentClaims = sum(currentPeriodData, 'claims')
  const previousClaims = sum(previousPeriodData, 'claims')
  const claimsChange =
    previousClaims === 0
      ? 100
      : ((currentClaims - previousClaims) / previousClaims) * 100

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
  console.log(currentPeriodCount, previousPeriodCount)

  const growthRate =
    previousPeriodCount === 0
      ? currentPeriodCount > 0
        ? 100
        : 0
      : ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100

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
