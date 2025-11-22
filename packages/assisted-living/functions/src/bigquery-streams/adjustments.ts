import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onAdjustmentWritten = onDocumentWritten(
  {
    database: process.env.DATABASE_ID,
    document:
      'providers/{providerId}/residents/{residentId}/adjustments/{adjustmentId}',
    region: 'europe-west1',
  },
  (event) =>
    streamToBigQuery(
      'adjustments',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
