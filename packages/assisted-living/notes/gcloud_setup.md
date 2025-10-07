# gcloud Setup Commands

This document tracks the `gcloud` commands used to set up the infrastructure for this project.

## Key Management Service (KMS)

### 1. Enable the KMS API

The following command was used to enable the Cloud KMS API for the project.

```bash
gcloud services enable cloudkms.googleapis.com --project=lean-ehr
```

### 2. Create a Key Ring

This command creates the `assisted-living` key ring in the `europe-west1` region.

```bash
gcloud kms keyrings create assisted-living --location=europe-west1 --project=lean-ehr
```

### 3. Create Crypto Keys (KEKs)

These commands create the three Key Encryption Keys for the different data sensitivity levels.

**General Data Key:**
```bash
gcloud kms keys create kek-general --keyring=assisted-living --location=europe-west1 --purpose=encryption --project=lean-ehr
```

**Contact Data Key:**
```bash
gcloud kms keys create kek-contact --keyring=assisted-living --location=europe-west1 --purpose=encryption --project=lean-ehr
```

**Clinical Data Key:**
```bash
gcloud kms keys create kek-clinical --keyring=assisted-living --location=europe-west1 --purpose=encryption --project=lean-ehr
```

### 4. Create a Service Account

This command creates a dedicated service account for the application.

```bash
gcloud iam service-accounts create assisted-living-app --display-name="Assisted Living Application Service Account" --project=lean-ehr
```

### 5. Grant IAM Permissions

These commands grant the new service account the necessary roles to access Firestore, Firebase Authentication, and the KMS keys.

**Firestore Access:**
```bash
gcloud projects add-iam-policy-binding lean-ehr --member=serviceAccount:assisted-living-app@lean-ehr.iam.gserviceaccount.com --role=roles/datastore.user
```

**Firebase Auth Access:**
```bash
gcloud projects add-iam-policy-binding lean-ehr --member=serviceAccount:assisted-living-app@lean-ehr.iam.gserviceaccount.com --role=roles/firebaseauth.admin
```

**KMS Access (per key):**
```bash
gcloud kms keys add-iam-policy-binding kek-general --keyring=assisted-living --location=europe-west1 --member=serviceAccount:assisted-living-app@lean-ehr.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter --project=lean-ehr

gcloud kms keys add-iam-policy-binding kek-contact --keyring=assisted-living --location=europe-west1 --member=serviceAccount:assisted-living-app@lean-ehr.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter --project=lean-ehr

gcloud kms keys add-iam-policy-binding kek-clinical --keyring=assisted-living --location=europe-west1 --member=serviceAccount:assisted-living-app@lean-ehr.iam.gserviceaccount.com --role=roles/cloudkms.cryptoKeyEncrypterDecrypter --project=lean-ehr
```

### 6. Generate Service Account Key

This command generates a JSON key file for the `assisted-living-app` service account. This key is used for local development authentication.

**Important:** Keep this file secure and do not commit it to version control.

```bash
gcloud iam service-accounts keys create secret-key/assisted-living-app-key.json \
  --iam-account=assisted-living-app@lean-ehr.iam.gserviceaccount.com \
  --project=lean-ehr
```

