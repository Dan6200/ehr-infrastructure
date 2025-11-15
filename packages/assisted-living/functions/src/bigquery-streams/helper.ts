import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'
import bigqueryClient from '../lib/bigquery'

const DATASET_ID = 'firestore_export'

export async function streamToBigQuery(
  collectionName: string,
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
) {
  const documentId = event.params[Object.keys(event.params)[0]]
  const tableId = `${collectionName}_raw`

  if (!event.data) {
    console.log(
      `No data for event on document ${documentId} in ${collectionName}.`,
    )
    return null
  }

  const { after } = event.data

  if (!after.exists) {
    console.log(
      `Document ${documentId} in ${collectionName} was deleted. No action taken for now.`,
    )
    return null
  }

  const data = after.data()
  if (!data) {
    console.log(
      `No data found for document ${documentId} in ${collectionName}.`,
    )
    return null
  }

  const rows = [
    {
      document_id: documentId,
      data: JSON.stringify(data),
      timestamp: event.time,
    },
  ]

  try {
    await bigqueryClient.dataset(DATASET_ID).table(tableId).insert(rows)
    console.log(
      `Successfully streamed document ${documentId} from ${collectionName} to BigQuery.`,
    )
  } catch (error) {
    console.error(
      `Failed to stream document ${documentId} from ${collectionName} to BigQuery:`,
      error,
    )
  }
  return null
}
