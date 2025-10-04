//cspell:ignore firestore

import db from './auth/server/config'

export const collectionWrapper = (path: string) => {
  try {
    return db.collection(path)
  } catch (e) {
    throw new Error(
      `Could not retrieve the ${path} Collection -- Tag:15.\n\t` + e,
    )
  }
}

//export const addDocWrapper = async (
//  reference: CollectionReference<any, DocumentData>,
//  data: any
//) => {
//  return addDoc(reference, data).catch((err) => {
//    throw new Error("Error adding document -- Tag:4.\n\t" + err);
//  });
//};
//
//export const getDocWrapper = async (
//  ref: DocumentReference<unknown, DocumentData>
//) => {
//  return getDoc(ref).catch((err) => {
//    throw new Error("Error retrieving document -- Tag:7.\n\t" + err);
//  });
//};
//
//export const getDocsWrapper = async (query: Query<unknown, DocumentData>) => {
//  return getDocs(query).catch((err) => {
//    throw new Error("Error retrieving all documents -- Tag:11.\n\t" + err);
//  });
//};
//
//export async function docWrapper(
//  reference: CollectionReference<unknown, DocumentData>,
//  path: string,
//  ...pathSegments: string[]
//): Promise<DocumentReference<DocumentData, DocumentData>>;
//
//export async function docWrapper(
//  firestore: Firestore,
//  path: string,
//  ...pathSegments: string[]
//): Promise<DocumentReference<DocumentData, DocumentData>>;
//
//export async function docWrapper(
//  firestoreOrReference: Firestore | CollectionReference<unknown, DocumentData>,
//  path: string,
//  ...pathSegments: string[]
//) {
//  try {
//    if ("id" in firestoreOrReference)
//      return doc(firestoreOrReference, path, ...pathSegments);
//    return doc(firestoreOrReference, path, ...pathSegments);
//  } catch (e) {
//    throw new Error(`Error retrieving the ${path} Document -- Tag:13.\n\t` + e);
//  }
//}
//
//export const updateDocWrapper = async (
//  reference: DocumentReference<unknown, any>,
//  data: any
//) => {
//  return updateDoc(reference, data).catch((err) => {
//    throw new Error("Error updating document -- Tag:5.\n\t" + err);
//  });
//};
//
//export const deleteDocWrapper = async (
//  reference: DocumentReference<unknown, DocumentData>
//) => {
//  return deleteDoc(reference).catch((err) => {
//    throw new Error("Error deleting document -- Tag:6.\n\t" + err);
//  });
//};
//
//export const queryWrapper = async (
//  _query: Query<Resident, DocumentData>,
//  ...constraints: QueryConstraint[]
//) => {
//  try {
//    return query(_query, ...constraints);
//  } catch (e) {
//    throw new Error("Error querying the Database -- Tag:8.\n\t" + e);
//  }
//};
