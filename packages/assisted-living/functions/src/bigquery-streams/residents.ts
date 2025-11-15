import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { streamToBigQuery } from './helper'
import {
  FirestoreEvent,
  Change,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore'

export const onResidentWritten = onDocumentWritten(
  {
    database: 'staging-beta',
    document: 'providers/{providerId}/residents/{residentId}',
  },
  (event) =>
    streamToBigQuery(
      'residents',
      event as FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
    ),
)
