'use server'

import { bigqueryClient } from '#/lib/bigquery'

export async function searchRxNorm(
  searchTerm: string,
): Promise<{ code: string; name: string }[]> {
  if (!searchTerm) {
    return []
  }

  const query = `
    SELECT
      RXCUI as code,
      STR as name
    FROM
      \`bigquery-public-data.nlm_rxnorm.rxnconso\`
    WHERE
      SAB = 'RXNORM'
      AND TTY IN ('SCD', 'SBD', 'GPCK', 'BPCK')
      AND STR LIKE @searchTerm
    LIMIT 10;
  `

  const options = {
    query: query,
    location: 'US', // The nlm_rxnorm dataset is in the US multi-region
    params: { searchTerm: `${searchTerm}%` },
  }

  try {
    const [rows] = await bigqueryClient.query(options)
    return rows
  } catch (error) {
    console.error('BigQuery error in searchRxNorm:', error)
    return []
  }
}
