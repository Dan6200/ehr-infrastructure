import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onClaimWritten = onDocumentWritten(
  {
    database: 'staging-beta',
    document: 'providers/{providerId}/residents/{residentId}/claims/{claimId}',
  },
  (event) =>
    streamToBigQuery(
      'claims',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
