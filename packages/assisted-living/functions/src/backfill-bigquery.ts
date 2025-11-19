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
import bigqueryClient from '#root/lib/bigquery/index.js' // Re-use the client from functions
import {
  decryptResidentData,
  decryptPayment,
  decryptAdjustment,
  decryptCharge,
  decryptClaim,
} from '#root/types/converters/index.js'
import {
  KEK_GENERAL_PATH,
  KEK_CONTACT_PATH,
  KEK_CLINICAL_PATH,
  KEK_FINANCIAL_PATH,
} from '#root/lib/encryption.js'

// --- Configuration ---
const PROVIDER_ID = 'GYRHOME' // Specify the provider to backfill
const DATASET_ID = 'firestore_export'
const BATCH_SIZE = 500 // Number of documents to process and insert at a time

async function backfill() {
  console.log('--- Starting BigQuery Backfill Script ---')

  const residentKekPaths = {
    KEK_GENERAL_PATH,
    KEK_CONTACT_PATH,
    KEK_CLINICAL_PATH,
  }
  admin.initializeApp()
  const firestore = getFirestore()
  firestore.settings({ databaseId: 'staging-beta' })
  const db = firestore

  const COLLECTIONS_TO_BACKFILL = {
    residents: {
      kekPath: 'complex',
      parent: null,
      decryptor: (doc: any) =>
        decryptResidentData(doc, ['ADMIN'], residentKekPaths),
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
    const tableId = `${collectionName.replace(/-/g, '_')}_raw`
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
        decryptor: (doc: any, kekPath?: any) => Promise<any>,
      ) {
        const snapshot = await ref.get()
        if (snapshot.empty) return

        let batch: any[] = []
        for (const doc of snapshot.docs) {
          const decryptedObject =
            collectionName === 'residents'
              ? await decryptor(doc.data())
              : await decryptor(doc.data(), kekPath)

          batch.push({ document_id: doc.id, ...decryptedObject })

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
