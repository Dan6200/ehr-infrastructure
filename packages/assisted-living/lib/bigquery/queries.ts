// Note: The table names (e.g., `charges_raw`) assume the backfill script
// and Cloud Functions are populating tables with this suffix.

export const getFinancialSummaryQuery = `
WITH all_transactions AS (
  -- Charges
  SELECT
    DATE(occurrence_datetime) as event_date,
    'charges' as type,
    (unit_price.value * quantity) as amount,
    unit_price.currency as currency
  FROM
    \`lean-ehr.firestore_export.charges_raw\`
  UNION ALL
  -- Claims
  SELECT
    DATE(authored_on) as event_date,
    'claims' as type,
    total.value as amount,
    total.currency as currency
  FROM
    \`lean-ehr.firestore_export.claims_raw\`
  UNION ALL
  -- Payments
  SELECT
    DATE(occurrence_datetime) as event_date,
    'payments' as type,
    amount.value as amount,
    amount.currency as currency
  FROM
    \`lean-ehr.firestore_export.payments_raw\`
  UNION ALL
  -- Adjustments
  SELECT
    DATE(authored_on) as event_date,
    'adjustments' as type,
    approved_amount.value as amount,
    approved_amount.currency as currency
  FROM
    \`lean-ehr.firestore_export.adjustments_raw\`
)
SELECT
  FORMAT_DATE('%Y-%m-%d', event_date) as date,
  ANY_VALUE(currency) as currency,
  SUM(CASE WHEN type = 'charges' THEN amount ELSE 0 END) as charges,
  SUM(CASE WHEN type = 'claims' THEN amount ELSE 0 END) as claims,
  SUM(CASE WHEN type = 'payments' THEN amount ELSE 0 END) as payments,
  SUM(CASE WHEN type = 'adjustments' THEN amount ELSE 0 END) as adjustments
FROM
  all_transactions
GROUP BY
  event_date
ORDER BY
  event_date;
`

export const getResidentGrowthQuery = `
SELECT
  DATE(created_at) as created_at
FROM
  \`lean-ehr.firestore_export.residents_raw\`
`
