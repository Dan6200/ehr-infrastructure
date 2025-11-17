/**
 * One-time script to backfill existing Firestore data into BigQuery.
 *
 * This script reads all documents from specified collections, decrypts them,
 * and bulk-inserts the decrypted data into the corresponding BigQuery tables.
 *
 * Usage:
 * ts-node dev-utils/backfill-bigquery.ts
 */

import { initializeApp } from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import bigqueryClient from './lib/bigquery' // Re-use the client from functions
import { decryptData, decryptDataKey, getKekPaths } from './lib/encryption' // Re-use the encryption logic from functions

// --- Configuration ---
const PROVIDER_ID = 'GYRHOME' // Specify the provider to backfill
const DATASET_ID = 'firestore_export'
const BATCH_SIZE = 500 // Number of documents to process and insert at a time

async function backfill() {
  console.log('--- Starting BigQuery Backfill Script ---')

  // Load KEK paths at RUNTIME
  const {
    KEK_GENERAL_PATH,
    KEK_FINANCIAL_PATH,
    // KEK_CLINICAL_PATH,
    // KEK_CONTACT_PATH,
  } = getKekPaths()

  // Map collection names to their KEK paths and any parent collections
  const COLLECTIONS_TO_BACKFILL = {
    residents: {
      kekPath: KEK_GENERAL_PATH,
      parent: null,
    },
    charges: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
    },
    claims: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
    },
    payments: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
    },
    adjustments: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
    },
    // TODO: Add other collections here
    // observations: { kekPath: KEK_CLINICAL_PATH, parent: 'residents' },
  }

  initializeApp()
  const firestore = getFirestore()
  firestore.settings({ databaseId: 'staging' })
  const db = firestore

  for (const [collectionName, config] of Object.entries(
    COLLECTIONS_TO_BACKFILL,
  )) {
    console.log(`\nProcessing collection: ${collectionName}...`)
    const tableId = `${collectionName}_raw`
    const table = bigqueryClient.dataset(DATASET_ID).table(tableId)
    let totalDocsProcessed = 0

    try {
      let collectionRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>

      if (config.parent === 'residents') {
        // This is a nested collection, we need to iterate through all residents
        const residentsSnapshot = await db
          .collection(`providers/${PROVIDER_ID}/residents`)
          .get()
        for (const residentDoc of residentsSnapshot.docs) {
          console.log(
            `  Backfilling ${collectionName} for resident ${residentDoc.id}...`,
          )
          const nestedCollectionRef = residentDoc.ref.collection(collectionName)
          await processCollection(nestedCollectionRef, config.kekPath)
        }
      } else {
        // This is a root-level collection for the provider
        collectionRef = db.collection(
          `providers/${PROVIDER_ID}/${collectionName}`,
        )
        await processCollection(collectionRef, config.kekPath)
      }

      async function processCollection(
        ref: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
        kekPath: string,
      ) {
        const snapshot = await ref.get()
        if (snapshot.empty) {
          console.log(`  No documents found in ${collectionName}. Skipping.`)
          return
        }

        let batch: any[] = []

        for (const doc of snapshot.docs) {
          const encryptedDoc = doc.data()
          const { encryptedDek, encryptedData } = encryptedDoc

          if (!encryptedDek || !encryptedData) {
            console.warn(
              `    - Document ${doc.id} is missing encryption fields. Skipping.`,
            )
            continue
          }

          const plaintextDek = await decryptDataKey(encryptedDek, kekPath)
          const decryptedString = decryptData(encryptedData, plaintextDek)
          const decryptedObject = JSON.parse(decryptedString)

          batch.push({
            document_id: doc.id,
            ...decryptedObject,
          })

          if (batch.length >= BATCH_SIZE) {
            await table.insert(batch)
            totalDocsProcessed += batch.length
            console.log(`    ...inserted ${batch.length} rows...`)
            batch = []
          }
        }

        if (batch.length > 0) {
          await table.insert(batch)
          totalDocsProcessed += batch.length
        }
      }

      console.log(
        `  ✅ Finished processing for ${collectionName}. Total rows inserted: ${totalDocsProcessed}`,
      )
    } catch (error) {
      console.error(
        `  ❌ Error processing collection ${collectionName}:`,
        error,
      )
    }
  }

  console.log('\n--- BigQuery Backfill Complete! ---')
}

backfill().catch((error) => {
  console.error('Script failed with an unhandled error:', error)
  process.exit(1)
})
