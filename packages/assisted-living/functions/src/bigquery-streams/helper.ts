import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'
import bigqueryClient from '@/lib/bigquery'
import { decryptData, decryptDataKey } from '@/lib/encryption'
import { KEK_GENERAL_PATH, KEK_FINANCIAL_PATH } from '@/lib/encryption'

const DATASET_ID = 'firestore_export'

export async function streamToBigQuery(
  collectionName: string,
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
) {
  // Load KEK paths at RUNTIME

  // Map collection names to their corresponding KEK path
  const COLLECTION_KEK_MAP: { [key: string]: string } = {
    residents: KEK_GENERAL_PATH,
    charges: KEK_FINANCIAL_PATH,
    claims: KEK_FINANCIAL_PATH,
    payments: KEK_FINANCIAL_PATH,
    adjustments: KEK_FINANCIAL_PATH,
  }

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

  const encryptedFirestoreDocument = after.data()
  if (!encryptedFirestoreDocument) {
    console.log(
      `No data found for document ${documentId} in ${collectionName}.`,
    )
    return null
  }

  // --- Decryption Step ---
  try {
    const { encryptedDek, encryptedData } = encryptedFirestoreDocument

    // Determine which KEK to use based on the collection name
    const actualKekPath = COLLECTION_KEK_MAP[collectionName]

    if (!actualKekPath || !encryptedDek || !encryptedData) {
      console.warn(
        `Document ${documentId} in ${collectionName} is missing encryption fields or a KEK mapping. Skipping decryption.`,
      )
      const row = {
        document_id: documentId,
        ...encryptedFirestoreDocument,
      }
      await bigqueryClient.dataset(DATASET_ID).table(tableId).insert([row])
      return null
    }

    // 1. Decrypt the DEK
    const plaintextDek = await decryptDataKey(encryptedDek, actualKekPath)

    // 2. Decrypt the actual data
    const decryptedDataString = decryptData(encryptedData, plaintextDek)

    // 3. Parse the decrypted string back into an object
    const decryptedObject = JSON.parse(decryptedDataString)

    const row = {
      document_id: documentId,
      ...decryptedObject,
    }

    await bigqueryClient.dataset(DATASET_ID).table(tableId).insert([row])
    console.log(
      `Successfully decrypted and streamed document ${documentId} from ${collectionName} to BigQuery.`,
    )
  } catch (error) {
    console.error(
      `Failed to decrypt and stream document ${documentId} from ${collectionName} to BigQuery:`,
      error,
    )
  }
  return null
}
