# Lean EHR: Assisted Living Module

## Overview

This is the Assisted Living module of the Lean EHR project, a modern, secure, and scalable Electronic Health Record system designed for assisted living facilities. Built with Next.js, Firebase (Firestore, Authentication, Functions), Google Cloud KMS, BigQuery, and Cloud Run, this module focuses on efficient resident management, secure data handling, and robust financial and clinical analytics.

## Key Features

- **Multi-Tenancy:** Secure data isolation for multiple facilities/providers using Firebase Auth Custom Claims and Firestore pathing.
- **End-to-End Encryption:** Sensitive resident data (clinical, contact, financial) is encrypted at rest in Firestore using Google Cloud KMS and a Key-in-Key (DEK/KEK) envelope encryption strategy with role-based access.
- **Real-time Analytics Dashboard:** A scalable dashboard providing financial overviews (charges, claims, payments, adjustments) and net resident growth, powered by BigQuery for efficient aggregation.
- **eMAR (Electronic Medication Administration Record):** Streamlined medication administration tracking for residents.
- **Terminology Lookups:** Integration with LOINC and RxNorm for standardized medical terminology.
- **Containerized Data Pipeline:** Automated data generation, encryption, and streaming to BigQuery using Python, Node.js, Docker, and Cloud Functions.
- **Modern Frontend:** Built with Next.js 15 (App Router), React, and Shadcn UI for a responsive and intuitive user experience.
- **Secure Authentication:** Firebase Authentication with Redis-backed session management and custom user roles.
- **CI/CD:** Automated deployment to Google Cloud Run via GitHub Actions.

## Architecture Highlights

- **Frontend:** Next.js 15 (App Router) with React, Shadcn UI.
- **Backend:** Next.js Server Actions, Firebase Admin SDK.
- **Database:** Google Cloud Firestore (multi-database for environments).
- **Encryption:** Google Cloud KMS (Key Management Service) for KEK management, Node.js Crypto module for AES-256-GCM DEK encryption.
- **Analytics Data Warehouse:** Google Cloud BigQuery, populated via Firebase Cloud Functions (Firestore triggers) for real-time, decrypted data streaming.
- **Caching/Session Management:** Google Cloud Memorystore (Redis).
- **Deployment:** Google Cloud Run (for Next.js application and data seeding jobs) via GitHub Actions.
- **Networking:** Cloud Run with Direct VPC Egress for private Redis connectivity, Cloud NAT for internet access to Google APIs.

## Local Development Setup

### Prerequisites

To get started with local development, ensure you have the following installed:

- Node.js (v20+)
- Python (v3.9+)
- Docker
- Google Cloud SDK (`gcloud` CLI)
- Firebase CLI (`firebase-tools`)
- `pnpm` (recommended package manager)
- **Firestore CLI:** Install the custom `firestore-cli` tool globally for seamless Firestore operations:
  ```bash
  npm install -g firestore-cli@Dan6200/firestore-cli
  # or using pnpm
  pnpm add -g firestore-cli@Dan6200/firestore-cli
  ```
  (For more details, visit: [https://github.com/Dan6200/firestore-cli](https://github.com/Dan6200/firestore-cli))

Your Google Cloud Project should be configured with:

- Firebase Project (Firestore, Authentication)
- Cloud KMS Key Ring and KEKs (General, Contact, Clinical, Financial)
- BigQuery APIs enabled
- Redis Instance (Memorystore)
- Service Account with necessary IAM roles (Firestore, KMS, BigQuery, Cloud Run, Artifact Registry, Firebase Auth)
- Local `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to your service account key JSON file.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/lean-ehr.git
    cd lean-ehr/packages/assisted-living
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    cd functions && pnpm install && cd ..
    ```
3.  **Environment Variables:**
    - Create a `.env.local` file in `packages/assisted-living/` and `packages/assisted-living/functions/` (for local Firebase Functions emulation).
    - Populate these with your Firebase project configuration and KMS paths. Refer to `packages/assisted-living/functions/.env.lean-ehr` for a template of necessary KMS and BQ variables.

### Running Locally

1.  **Start Firebase Emulators:**
    ```bash
    firebase emulators:start --import=./firebase/emulator-data --export-on-exit=./firebase/emulator-data
    ```
    _(Note: Ensure your `firebase.json` has `firestore.database: "staging-beta"` configured if you're using named databases)._
2.  **Start Next.js Development Server:**
    ```bash
    pnpm dev
    ```

### Test Credentials (Admin User)

You can log in with the following credentials for testing:

- **Email:** `dev@mail.com`
- **Password:** `Developer`

## Data Seeding & Backfill

This project includes a powerful data generation and encryption pipeline.

1.  **Generate Plaintext Demo Data:**
    ```bash
    python3 dev-utils/generate_demo_subcollection_data.py
    ```
    This script generates plaintext JSON files for residents and their subcollections (financials, clinical data, etc.) into `demo-data/`.
2.  **Generate Encrypted Payload:**
    ```bash
    cd dev-utils/generate-encrypted-payload/ && pnpm start && cd ../..
    ```
    This encrypts the plaintext data using KMS and generates `demo-data/firestore-encrypted-payload.jsonl`.
3.  **Upload to Firestore:**
    _(Note: This usually requires an admin service account key or ADC.)_
    ```bash
    # Ensure your firestore-cli is configured (e.g., with a service account key)
    firestore-cli set "providers/GYRHOME" -b -f demo-data/firestore-encrypted-payload.jsonl --jsonl --database-id=staging-beta
    ```
4.  **Backfill to BigQuery:**
    ```bash
    cd functions && pnpm backfill-bq && cd ..
    ```
    This runs a one-time script to decrypt existing Firestore data and insert it into BigQuery.

## Deployment

Deployment is automated via GitHub Actions workflows.

### 1. Application Deployment (Next.js to Cloud Run)

- **Workflow File:** `.github/workflows/deploy-app.yml` (ensure this file is moved to your repository root).
- **Trigger:** Pushing changes to the `main` branch within the `packages/assisted-living/` directory, or manually via `workflow_dispatch`.
- **Process:**
  1.  Authenticates to GCP using Workload Identity Federation.
  2.  Fetches KMS configuration dynamically.
  3.  Builds the Next.js Docker image (`Dockerfile.prod`) using build arguments for Firebase and Cloudinary public config.
  4.  Pushes the image to Google Artifact Registry.
  5.  Deploys the image as a Cloud Run service (`assisted-living-app`).
  6.  Configures Cloud Run with Direct VPC Egress, linking it to your `default` network/subnet.
- **Required GitHub Secrets:**
  - `FB_API_KEY`, `FB_AUTH_DOMAIN`, `FB_STORAGE_BUCKET`, `FB_APP_ID`, `FB_MESSAGING_SENDER_ID` (for client-side Firebase config).
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (for server-side Redis connection).

### 2. Manual Data Seeding & Functions/Indexes Deployment

- **Workflow File:** `.github/workflows/manual-seed-deploy.yml` (ensure this file is moved to your repository root).
- **Trigger:** Manual dispatch only.
- **Process:**
  1.  Authenticates to GCP using Workload Identity Federation.
  2.  Executes the `seed-database.sh` script within a Cloud Run Job (`lean-ehr-data-upload`).
  3.  Deploys Firebase Firestore Rules, Indexes, and Functions (including the BigQuery streaming functions).

### Infrastructure Setup Commands

Before deploying, ensure these Google Cloud resources are provisioned:

1.  **Enable APIs:**
    ```bash
    gcloud services enable cloudkms.googleapis.com bigquery.googleapis.com artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com iam.googleapis.com vpcaccess.googleapis.com redis.googleapis.com --project=lean-ehr
    ```
2.  **Create Artifact Registry:**
    ```bash
    gcloud artifacts repositories create lean-ehr-repo --repository-format=docker --location=europe-west1 --project=lean-ehr
    ```
3.  **Cloud KMS Keys:** Create your `assisted-living` keyring and KEKs (general, contact, clinical, financial) as detailed in `notes/gcloud_setup.md`.
4.  **Service Accounts & IAM:** Create `assisted-living-app` service account and grant necessary IAM roles (KMS Encrypter/Decrypter, Firestore User, BigQuery User, Cloud Run Invoker, Artifact Registry Writer, Firebase Auth Admin).
    - **Crucial:** Grant `roles/artifactregistry.writer` to `assisted-living-app@lean-ehr.iam.gserviceaccount.com` for your `lean-ehr-repo` Artifact Registry.
    - Also grant `roles/iam.serviceAccountUser` to the `assisted-living-app` service account itself:
      ```bash
      gcloud iam service-accounts add-iam-policy-binding \
        "assisted-living-app@lean-ehr.iam.gserviceaccount.com" \
        --member="serviceAccount:assisted-living-app@lean-ehr.iam.gserviceaccount.com" \
        --role="roles/iam.serviceAccountUser" \
        --project=lean-ehr
      ```
5.  **Memorystore Redis:**
    ```bash
    gcloud redis instances create lean-ehr-redis --size=1 --region=europe-west1 --zone=europe-west1-b --tier=BASIC --project=lean-ehr
    # Note down the host and port
    ```
6.  **Cloud NAT Gateway (if using VPC Egress 'all-traffic'):**
    ```bash
    gcloud compute routers create lean-ehr-router --network=default --region=europe-west1 --project=lean-ehr
    gcloud compute nats create lean-ehr-nat-gateway --router=lean-ehr-router --region=europe-west1 --auto-allocate-nat-external-ips --nat-all-subnet-ip-ranges --project=lean-ehr
    ```
    _(Note: If using `--vpc-egress=private-ranges-only`, NAT is not strictly needed for public internet access, but is a good practice for consistent egress.)_

---
