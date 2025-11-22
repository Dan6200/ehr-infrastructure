import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onClaimWritten = onDocumentWritten(
  {
    database: process.env.DATABASE_ID,
    document: 'providers/{providerId}/residents/{residentId}/claims/{claimId}',
    region: 'europe-west1',
  },
  (event) =>
    streamToBigQuery(
      'claims',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
