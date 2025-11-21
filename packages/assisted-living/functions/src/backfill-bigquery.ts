/**
 * One-time script to backfill existing Firestore data into BigQuery.
 *
 * This script reads all documents from specified collections, decrypts them,
 * and bulk-inserts the decrypted data into the corresponding BigQuery tables.
 *
 * Usage:
 * ts-node dev-utils/backfill-bigquery.ts
 */

import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import bigqueryClient from '#root/lib/bigquery' // Re-use the client from functions
import {
  decryptPayment,
  decryptAdjustment,
  decryptCharge,
  decryptClaim,
} from '#root/types/converters'
import { KEK_FINANCIAL_PATH } from '#root/lib/encryption'

// --- Configuration ---
const PROVIDER_ID = 'GYRHOME' // Specify the provider to backfill
const DATASET_ID = process.env.BQ_DATASET_ID || 'firestore_export_staging'
const BATCH_SIZE = 500 // Number of documents to process and insert at a time

async function backfill() {
  console.log('--- Starting BigQuery Backfill Script ---')

  admin.initializeApp()
  const firestore = getFirestore()
  firestore.settings({ databaseId: 'staging' })
  const db = firestore

  const COLLECTIONS_TO_BACKFILL = {
    residents: {
      kekPath: 'complex',
      parent: null,
      decryptor: null,
    },
    charges: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
      decryptor: decryptCharge,
    },
    payments: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
      decryptor: decryptPayment,
    },
    claims: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
      decryptor: decryptClaim,
    },
    adjustments: {
      kekPath: KEK_FINANCIAL_PATH,
      parent: 'residents',
      decryptor: decryptAdjustment,
    },
  }

  for (const [collectionName, config] of Object.entries(
    COLLECTIONS_TO_BACKFILL,
  )) {
    console.log(`\nProcessing collection: ${collectionName}...`)
    const tableId =
      collectionName === 'residents'
        ? 'resident_timestamps_raw'
        : `${collectionName.replace(/-/g, '_')}_raw`
    const table = bigqueryClient.dataset(DATASET_ID).table(tableId)
    let totalDocsProcessed = 0

    try {
      if (config.parent === 'residents') {
        const residentsSnapshot = await db
          .collection(`providers/${PROVIDER_ID}/residents`)
          .get()
        for (const residentDoc of residentsSnapshot.docs) {
          const nestedCollectionRef = residentDoc.ref.collection(collectionName)
          await processCollection(
            nestedCollectionRef,
            config.kekPath,
            config.decryptor,
          )
        }
      } else {
        const collectionRef = db.collection(
          `providers/${PROVIDER_ID}/${collectionName}`,
        )
        await processCollection(collectionRef, config.kekPath, config.decryptor)
      }

      async function processCollection(
        ref: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
        kekPath: string,
        decryptor: (doc: any, kekPath: string) => Promise<any> | null,
      ) {
        const snapshot = await ref.get()
        if (snapshot.empty) return

        let batch: any[] = []
        for (const doc of snapshot.docs) {
          let objectToInsert: any
          if (collectionName === 'residents') {
            const residentData = doc.data()
            objectToInsert = {
              id: doc.id,
              created_at: residentData.created_at,
              deactivated_at: residentData.deactivated_at,
            }
          } else {
            objectToInsert = await decryptor(
              { id: doc.id, ...doc.data() },
              kekPath,
            )
          }

          batch.push(objectToInsert)

          if (batch.length >= BATCH_SIZE) {
            await table.insert(batch)
            totalDocsProcessed += batch.length
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
        JSON.stringify(error, null, 2),
      )
    }
  }
  console.log('\n--- BigQuery Backfill Complete! ---')
}

backfill().catch((error) => {
  console.error('Script failed with an unhandled error:', error)
  process.exit(1)
})
