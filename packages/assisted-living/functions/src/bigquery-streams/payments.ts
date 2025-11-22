import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onPaymentWritten = onDocumentWritten(
  {
    database: process.env.DATABASE_ID,
    document:
      'providers/{providerId}/residents/{residentId}/payments/{paymentId}',
    region: 'europe-west1',
  },
  (event) =>
    streamToBigQuery(
      'payments',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
