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
import {
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption'

const DATASET_ID = 'firestore_export'

const residentKekPaths = {
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
}

const COLLECTIONS_MAP = {
  residents: {
    kekPath: 'complex',
    parent: null,
    decryptor: (doc: any) =>
      decryptResidentData(doc, ['ADMIN'], residentKekPaths),
  },
  charges: {
    kekPath: KEK_FINANCIAL_PATH,
    parent: 'residents',
    decryptor: decryptCharge,
  },
  payments: {
    kekPath: KEK_FINANCIAL_PATH,
    parent: 'residents',
    decryptor: decryptPayment,
  },
  claims: {
    kekPath: KEK_FINANCIAL_PATH,
    parent: 'residents',
    decryptor: decryptClaim,
  },
  adjustments: {
    kekPath: KEK_FINANCIAL_PATH,
    parent: 'residents',
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
  // I don't understand your reasoning for this =>   const documentId = event.params.adjustmentId || event.params.paymentId || event.params.claimId || event.params.chargeId || event.params.residentId;
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

  const { kekPath, decryptor } = COLLECTIONS_MAP[collectionName]
  if (!decryptor) {
    console.warn(
      `No decryptor found for collection: ${collectionName}. Skipping.`,
    )
    return null
  }

  try {
    const decryptedObject = await decryptor(
      { document_id: documentId, ...encryptedFirestoreDocument },
      kekPath === 'complex' ? residentKekPaths : kekPath,
    )

    await bigqueryClient
      .dataset(DATASET_ID)
      .table(tableId)
      .insert([decryptedObject])
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
