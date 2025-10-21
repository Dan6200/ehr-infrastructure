# Feature Plan: Clinical and Financial Data Integration

This document outlines the high-level plan for integrating clinical data (allergies, prescriptions with SNOMED/RxNorm codes) and financial data into the application.

---

## Phase 1: Data Structure and Encryption Foundation

**Goal:** Update the core data structures and encryption mechanisms to support the new data types.

1.  **Create a New KMS Key for Financial Data:**
    - A new Key Encryption Key (KEK) named `kek-financial` will be created in Google Cloud KMS.
    - This provides cryptographic separation between clinical, contact, and financial data, enhancing security.

2.  **Update Data Type Definitions (`types/index.ts`):**
    - Define new Zod schemas for `Allergy`, `Prescription`, and `FinancialTransaction`.
    - `AllergySchema` will include a `snomed_code` field.
    - `PrescriptionSchema` will include an `rxnorm_code` field.
    - `FinancialTransactionSchema` will include `amount`, `date`, `type`, and `description`.
    - Add `allergies`, `prescriptions`, and `financials` arrays to the main `ResidentSchema`.
    - Define corresponding `EncryptedAllergySchema`, `EncryptedPrescriptionSchema`, etc.
    - Add `encrypted_dek_financial` and the new encrypted arrays to the `EncryptedResidentSchema`.

3.  **Update Encryption Converters (`types/converters.ts`):**
    - Modify `encryptResident` to handle the new `financials` array, using the new `kek-financial` to generate and wrap a `dek_financial`.
    - Update the encryption logic for `allergies` and `prescriptions` to use the existing `dek_clinical`.
    - Modify `decryptResidentData` to decrypt these new fields based on user roles and the corresponding DEKs.

---

## Phase 2: User Interface and Experience

**Goal:** Build the necessary pages and forms for users to view and manage the new data.

1.  **Update Resident Navigation (`components/resident-nav.tsx`):**
    - Add new links to the resident navigation bar for "Allergies", "Prescriptions", and "Billing".

2.  **Create "View" Pages:**
    - Build dedicated pages for `.../allergies`, `.../prescriptions`, and `.../billing` to display the respective data in a clear, read-only format.

3.  **Create Dedicated "Edit" Pages:**
    - Following the established pattern, create separate edit pages: `.../allergies/edit`, `.../prescriptions/edit`, and `.../billing/edit`.
    - Each edit page will contain a dedicated form for managing its data (e.g., adding an allergy, logging a payment).
    - The corresponding "View" page will link to its "Edit" page.

---

## Phase 3: Revenue Calculation and Dashboard Integration

**Goal:** Use the new financial data to provide business insights.

1.  **Create Revenue Calculation Logic:**
    - Implement a new server action, `calculateRevenue(residentId)`, that fetches and processes all financial transactions for a resident.
    - This action will compute key metrics like total charges, total payments, and outstanding balance.

2.  **Display on Dashboard:**
    - Integrate the revenue calculation into the main admin dashboard (`/admin/dashboard`).
    - Display the financial overview in a new dashboard card or as part of the main data table to provide at-a-glance insights.
