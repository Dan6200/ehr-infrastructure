# Feature Plan: Terminology Lookup Integration

This document outlines the plan for integrating RxNorm, LOINC, and SNOMED terminology lookups into the application.

---

## 1. Strategy

A hybrid approach will be used, leveraging the best available source for each terminology:

- **RxNorm:** Utilize the free, managed `bigquery-public-data.nlm_rxnorm` dataset for all lookups.
- **LOINC:** Host a private LOINC table in BigQuery, loaded from the official CSV distribution. This gives us control over the data while leveraging BigQuery's power.
- **SNOMED CT:** Connect to the existing Snowstorm-lite terminology server endpoint via standard REST API calls.

## 2. Implementation Plan

### Phase 1: Backend & Infrastructure

1.  **Enable BigQuery API:**
    - The `bigquery.googleapis.com` API must be enabled for the GCP project.

2.  **Set up LOINC Table in BigQuery:**
    - Create a new BigQuery dataset (e.g., `loinc`).
    - Upload the official LOINC CSV file(s) to a Google Cloud Storage bucket.
    - Use the `bq load` command to create and populate a table in the `loinc` dataset.
    - This process will be documented in `notes/bigquery_setup.md`.

3.  **Create a BigQuery Client:**
    - A new file at `lib/bigquery.ts` will be created to instantiate and export a singleton BigQuery client for use in server actions.

4.  **Create Server Actions for Lookups:**
    - **RxNorm (`actions/lookups/search-rxnorm.ts`):**
      - Will query the `bigquery-public-data.nlm_rxnorm.rxnconso` table.
      - The query will filter for `SAB = 'RXNORM'` and common term types (TTY) like `SCD`, `SBD`.
      - It will accept a search term and return a list of codes and names.
    - **LOINC (`actions/lookups/search-loinc.ts`):**
      - Will query our private `loinc.loinc_core` table.
      - It will accept a search term and return a list of LOINC codes and component names.
    - **SNOMED (`actions/lookups/search-snomed.ts`):**
      - Will use the `fetch` API to make a GET request to the provided Snowstorm-lite endpoint.
      - It will pass the search term as a query parameter.
      - It will parse the JSON response and return a list of concept IDs and names.

### Phase 2: Frontend Integration

1.  **Create a Reusable Autocomplete Component:**
    - A new component, `components/ui/autocomplete.tsx`, will be created.
    - This component will be a client component that takes a search function (one of our new server actions) as a prop.
    - It will manage its own state for search terms, loading indicators, and results.
    - It will render a dropdown/popover with the search results for the user to select from.

2.  **Integrate into Forms:**
    - The `snomed_code`, `rxnorm_code`, and `loinc_code` fields in the `AllergiesForm`, `PrescriptionsForm`, `MedicalRecordsForm`, and `VitalsForm` will be updated.
    - The plain `Input` will be replaced with the new `Autocomplete` component, passing the corresponding search action to it.
