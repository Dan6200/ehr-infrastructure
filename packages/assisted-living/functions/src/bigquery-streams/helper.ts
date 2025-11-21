import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'
import bigqueryClient from '#root/lib/bigquery'
import {
  decryptResidentData,
  decryptPayment,
  decryptAdjustment,
  decryptCharge,
  decryptClaim,
} from '#root/types/converters'
import { KEK_FINANCIAL_PATH } from '#root/lib/encryption'

const DATASET_ID = process.env.BQ_DATASET_ID || 'firestore_export_staging'

const COLLECTIONS_MAP = {
  residents: {
    kekPath: 'complex',
    decryptor: null,
  },
  charges: {
    kekPath: KEK_FINANCIAL_PATH,
    decryptor: decryptCharge,
  },
  payments: {
    kekPath: KEK_FINANCIAL_PATH,
    decryptor: decryptPayment,
  },
  claims: {
    kekPath: KEK_FINANCIAL_PATH,
    decryptor: decryptClaim,
  },
  adjustments: {
    kekPath: KEK_FINANCIAL_PATH,
    decryptor: decryptAdjustment,
  },
}

export async function streamToBigQuery(
  collectionName:
    | 'residents'
    | 'charges'
    | 'payments'
    | 'adjustments'
    | 'claims',
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
) {
  const documentId = event.params[Object.keys(event.params)[0]]

  if (!event.data) {
    console.log(
      `No data for event on document ${documentId} in ${collectionName}.`,
    )
    return null
  }

  const { after } = event.data

  if (!after.exists) {
    console.log(
      `Document ${documentId} in ${collectionName} was deleted. No action taken.`,
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

  const config = COLLECTIONS_MAP[collectionName]
  if (!config || !config.decryptor) {
    console.warn(
      `No decryptor configuration found for collection: ${collectionName}. Skipping.`,
    )
    return null
  }

  try {
    let objectToInsert: any
    const tableId =
      collectionName === 'residents'
        ? 'resident_timestamps_raw'
        : `${collectionName.replace(/-/g, '_')}_raw`

    if (collectionName === 'residents') {
      const decryptedResident = encryptedFirestoreDocument
      objectToInsert = {
        id: documentId,
        created_at: decryptedResident.created_at,
        deactivated_at: decryptedResident.deactivated_at,
      }
    } else {
      objectToInsert = await config.decryptor(
        { id: documentId, ...encryptedFirestoreDocument } as any,
        config.kekPath as string,
      )
    }

    await bigqueryClient
      .dataset(DATASET_ID)
      .table(tableId)
      .insert([objectToInsert])
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
