#!/bin/bash

# This script orchestrates the entire process of seeding the Firestore database.
# It generates plaintext data, encrypts it, and then uploads the final payload.

set -e # Exit immediately if a command exits with a non-zero status.

# # --- Configuration ---
# ENCRYPTED_PAYLOAD_FILE="demo-data/firestore-encrypted-payload.jsonl"
# PROVIDER_ID="GYRHOME" # Define the target provider ID
#
# ENVIRONMENT="dev"
# if [ "$1" == "--prod" ]; then
#   ENVIRONMENT="prod"
# fi
#
# # --- Arguments Setup for firestore-cli ---
# # In the 'prod' (Cloud Run) environment, authentication is handled automatically
# # by the service account attached to the job (Application Default Credentials).
# # In the 'dev' environment, we use the local service account key.
# ARGS="--rate-limit 500 --database-id staging-beta"
# if [ "$ENVIRONMENT" == "prod" ]; then
#   echo "Running in production mode. Using Application Default Credentials."
# else
#   echo "Running in development mode. Using local service account key."
#   KEY_PATH="secret-key/assisted-living-app-key.json"
#   if [ ! -f "$KEY_PATH" ]; then
#     echo "Error: Development key file not found at $KEY_PATH" >&2
#     exit 1
#   fi
#   ARGS="-k $KEY_PATH $ARGS"
# fi
#
# # # --- Step 0: Create Admin User ---
# # echo "--- Step 0: Creating Admin User... ---"
# # cd dev-utils/create-user.ts 
# # npm start dev@mail.com Developer ADMIN,CLINICIAN,CAREGIVER,VIEWER
#
# # --- Step 1: Generate Plaintext Demo Data ---
# echo "--- Step 1: Generating all plaintext demo data... ---"
# python3 dev-utils/generate_demo_subcollection_data.py
#
# # --- Step 2: Generate Encrypted Payload ---
# echo "--- Step 2: Encrypting all data to a single payload... ---"
# cd dev-utils/generate-encrypted-payload/ 
# npm start
# cd /app
#
# # --- Step 3: Starting Firestore Upload ---
# echo "--- Step 3: Starting Firestore upload... "
#
# if [ ! -f "$ENCRYPTED_PAYLOAD_FILE" ]; then
#   echo "Error: Encrypted payload file not found at $ENCRYPTED_PAYLOAD_FILE" >&2
#   exit 1
# fi
#
# # Bulk upload facilities
# echo "Uploading facilities..."
# firestore-cli set "providers/$PROVIDER_ID/facilities" -b -f demo-data/facilities/data.json $ARGS
# # Bulk upload all data from the encrypted payload file
# echo "Uploading residents and all subcollections..."
# firestore-cli set "providers/$PROVIDER_ID" -b -f $ENCRYPTED_PAYLOAD_FILE --jsonl $ARGS
#
# # echo "\n--- Upload Complete! ---"
#
# # --- Step 4: Deploy Firestore Rules, Indexes, and Functions ---
# echo "--- Step 4: Setting Up Rules, Indexes, and Functions ---"
#
# firebase deploy --only firestore,functions --force
#
# --- Step 5: Backfill Existing Data to BigQuery ---
echo "--- Step 5: Backfilling existing Firestore data to BigQuery... ---"
cd functions/
echo "pwd"
pwd
echo "ls lib/"
ls lib/
echo "ls lib/src/"
ls lib/src/
echo "ls lib/src/lib/"
ls lib/src/lib/
npm run backfill-bq
