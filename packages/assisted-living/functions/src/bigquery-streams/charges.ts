import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onChargeWritten = onDocumentWritten(
  {
    database: 'staging-beta',
    document:
      'providers/{providerId}/residents/{residentId}/charges/{chargeId}',
  },
  (event) =>
    streamToBigQuery(
      'charges',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
