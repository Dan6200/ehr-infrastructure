import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onChargeWritten = onDocumentWritten(
  {
    database: process.env.DATABASE_ID,
    document:
      'providers/{providerId}/residents/{residentId}/charges/{chargeId}',
    region: 'europe-west1',
  },
  (event) =>
    streamToBigQuery(
      'charges',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
