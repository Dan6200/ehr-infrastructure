//cspell:ignore firestore

import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  query,
  Query,
  QueryConstraint,
  updateDoc,
} from 'firebase/firestore'
import { db } from './auth/server/config'
import { Resident } from '@/types'
export { startAfter, limit as limitQuery } from 'firebase/firestore'

export const collectionWrapper = (path: string) => {
  try {
    return collection(db, path)
  } catch (e) {
    throw new Error(
      `Could not retrieve the ${path} Collection -- Tag:15.\n\t` + e,
    )
  }
}

export const addDocWrapper = async <T, U extends DocumentData>(
  reference: CollectionReference<T, U>,
  data: T,
) => {
  return addDoc(reference, data).catch((err) => {
    throw new Error('Error adding document -- Tag:4.\n\t' + err)
  })
}

export const getDocWrapper = async <T, U extends DocumentData>(
  ref: DocumentReference<T, U>,
) => {
  return getDoc(ref).catch((err) => {
    throw new Error('Error retrieving document -- Tag:7.\n\t' + err)
  })
}

export const getDocsWrapper = async <T, U extends DocumentData>(
  query: Query<T, U>,
) => {
  return getDocs(query).catch((err: any) => {
    throw new Error('Error retrieving all documents -- Tag:11.\n\t' + err)
  })
}

export async function docWrapper<T, U extends DocumentData>(
  reference: CollectionReference<T, U>,
  path: string,
  ...pathSegments: string[]
): Promise<DocumentReference<T, U>>

export async function docWrapper<T, U extends DocumentData>(
  firestore: Firestore,
  path: string,
  ...pathSegments: string[]
): Promise<DocumentReference<T, U>>

export async function docWrapper<T, U extends DocumentData>(
  firestoreOrReference: Firestore | CollectionReference<T, U>,
  path: string,
  ...pathSegments: string[]
) {
  try {
    if ('id' in firestoreOrReference)
      return doc(firestoreOrReference, path, ...pathSegments)
    return doc(firestoreOrReference, path, ...pathSegments)
  } catch (e) {
    throw new Error(`Error retrieving the ${path} Document -- Tag:13.\n\t` + e)
  }
}

export const updateDocWrapper = async <T, U extends DocumentData>(
  reference: DocumentReference<T, U>,
  data: any,
) => {
  return updateDoc(reference, data).catch((err) => {
    throw new Error('Error updating document -- Tag:5.\n\t' + err)
  })
}

export const deleteDocWrapper = async <T, U extends DocumentData>(
  reference: DocumentReference<T, U>,
) => {
  return deleteDoc(reference).catch((err) => {
    throw new Error('Error deleting document -- Tag:6.\n\t' + err)
  })
}

export const queryWrapper = <T, U extends DocumentData>(
  _query: Query<T, U>,
  ...constraints: QueryConstraint[]
) => {
  try {
    return query(_query, ...constraints)
  } catch (e) {
    throw new Error('Error querying the Database -- Tag:8.\n\t' + e)
  }
}

import { getCountFromServer } from 'firebase/firestore'

export const getCount = async <T, U extends DocumentData>(
  query: Query<T, U>,
) => {
  return getCountFromServer(query).catch((err) => {
    throw new Error('Error retrieving count from query: ' + err)
  })
}
