import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onAdjustmentWritten = onDocumentWritten(
  {
    database: 'staging-beta',
    document:
      'providers/{providerId}/residents/{residentId}/adjustments/{adjustmentId}',
  },
  (event) =>
    streamToBigQuery(
      'adjustments',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
