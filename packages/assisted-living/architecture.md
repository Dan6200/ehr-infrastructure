# Architecture — Assisted Living

Current design, the decisions behind it, and the direction of travel. This
complements `README.md` (setup/deployment) and the issue tracker.

## System context

| Layer                  | Choice                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| Frontend               | Next.js 15 (App Router), React, Shadcn UI                          |
| Backend                | Next.js Server Actions, Firebase Admin SDK                         |
| Primary store          | Firestore (multi-database per environment)                         |
| Key management         | Google Cloud KMS (four KEKs)                                       |
| Session/cache          | Google Cloud Memorystore (Redis)                                   |
| Analytics              | BigQuery (financial aggregation)                                   |
| Terminology            | Snowstorm-Lite (SNOMED CT) on Cloud Run; LOINC/RxNorm via BigQuery |
| Cold archive (planned) | Google Cloud Storage (ciphertext)                                  |
| Deploy                 | Cloud Run + Cloud Functions, GitHub Actions                        |

Firestore layout: `providers/{providerId}/residents/{residentId}/{subcollection}/{docId}`.

## Data model

- **Resident** is the aggregate root; clinical/contact/financial records live in
  subcollections.
- **FHIR-inspired domain model.** Domain objects use FHIR-shaped fields and a
  `Reference` for the patient (`subject` / `patient` / `beneficiary` / `for`).
- **Storage linkage is a plaintext `resident_id`.** Firestore `.where()` and the
  archive object path need a raw field; converters bridge
  `resident_id` ↔ `patient: { reference: "Patient/<id>" }`.
- **`CarePlan.activity[]` is nested** (FHIR BackboneElement with `detail`), not a
  separate subcollection, so it archives/truncates with its parent.
- FHIR element names follow the codebase's snake_case convention
  (`scheduledTiming` → `scheduled_timing`, `doNotPerform` → `do_not_perform`).
- **Not full FHIR conformance.** No FHIR REST/search/bundles/terminology server;
  the model is "FHIR-inspired", not FHIR-compliant (see
  `notes/resident_linkage_standardization.md`).

## Encryption & access control

### Envelope mode (default, production)

- A random DEK per document encrypts the payload with AES-256-GCM; the DEK is
  wrapped by a KEK in Cloud KMS.
- Four KEK classes: **general**, **contact**, **clinical**, **financial**.
- `lib/access-control.ts` owns the role → KEK-class matrix. Decryption in the
  resident document is role-gated; subcollection reads are now gated too
  (`getNestedResidentData`), after fixing a gap where roles were verified but
  discarded.
- This is **cryptographic RBAC**: a role without unwrap capability cannot decrypt
  that class even with the ciphertext and wrapped DEK.
- The store sees ciphertext; only non-role-sensitive linkage (`resident_id`,
  `facility_id`, timestamps) is plaintext.

### Plaintext mode (in progress)

- Goal: a regular-EHR tier for verticals where field-level encryption is
  friction.
- `lib/crypto` defines a `CryptoProvider` interface; `KmsEnvelopeProvider` and
  `PlaintextProvider` implement it; `CRYPTO_MODE` selects one and fails closed
  on unknown values.
- **Distinct storage formats**, not identity crypto over the envelope shape.
  Documents carry `crypto_scheme: 'kms-envelope:v1' | 'none:v1'`; plaintext
  documents have no `encrypted_*` fields and no wrapped DEK.
- Reads verify the document's scheme against the active mode and **fail closed**
  on mismatch; envelope reads still require a real KMS unwrap.
- Migrated: `allergies`, `observations`, `diagnostic_history`, `prescriptions`,
  `charges`, `payments`, `adjustments`.
- Not yet: the resident document, the remaining subcollections, and
  tenant-scoped mode configuration. In plaintext mode, role gating degrades to
  application-level authorization.

### Threat model

- High-privacy: the store/cloud provider sees ciphertext; only authorized roles
  with KMS access decrypt.
- Plaintext: the store is trusted; protect with IAM, network controls, audit.
- Not defended against: an attacker holding the application's service-account
  and KMS permissions.

## Retention & encrypted archive (designed, not implemented)

- **Hot tier:** Firestore keeps recent data; cutoff from `RETENTION_DAYS`
  (default 90).
- **Cold tier:** GCS ciphertext archive keyed by
  `providers/{providerId}/residents/{residentId}/{collection}/{retention_ts}/{docId}.json`.
- **Rehydrate:** list + download + decrypt the archived blobs with the same
  converters, then merge with the Firestore slice.
- **Truncation:** a scheduled Cloud Function deletes Firestore documents only
  after the archive write is confirmed.
- **BigQuery is analytics-only** (financial), never a PHI archive.
- A plaintext `retention_ts` still needs to be added: event dates are encrypted,
  so Firestore can't filter on them.
- Tracked in #3, #4, #5. See `notes/data_retention_and_gcs_archive.md`.

## Analytics

Firestore triggers stream **financial** collections (`charges`, `claims`,
`payments`, `adjustments`) into BigQuery `*_raw` tables; the dashboard aggregates
there. Clinical/contact data is deliberately not streamed.

## Terminology services

Hybrid lookups through `actions/lookups/*`:

| Terminology | Source                                                                                                                                                                                                                                                                                            | Used by                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| SNOMED CT   | Self-hosted **Snowstorm-Lite** (Snowstorm 2.3.1) with the UK RF2 release (20250924) pre-indexed at image build. `packages/deploy-snowstorm-lite` + `cloudbuild.yaml` build and deploy it to Cloud Run (`snowstorm-lite-service`); the app calls it via `SNOWSTORM_API_BASE_URL` (`searchSnomed`). | allergies, diagnostic history |
| LOINC       | Private BigQuery dataset (`loinc.loinc_core`), loaded from the official CSV (`searchLoinc`).                                                                                                                                                                                                      | observations                  |
| RxNorm      | BigQuery public dataset (`bigquery-public-data.nlm_rxnorm`) (`searchRxNorm`).                                                                                                                                                                                                                     | prescriptions                 |

The forms use the shared `Autocomplete` component against these actions. See
`notes/terminology_lookup_plan.md`.

## Multi-tenancy

Current: Firebase Auth custom claims (`provider_id`, `roles`) plus Firestore
pathing. Native Firebase Auth multi-tenancy is proposed in #1/#2.

## Testing & tooling

- Jest unit suite: access-control matrix, FHIR `Reference`, nested
  `CarePlan.activity[]`, encrypted write shapes, storage codecs, provider
  factory.
- `pnpm test` (no emulator required) and `pnpm typecheck`.
- **Gap:** no integration/e2e tests (Firestore emulator + KMS) and no CI gate;
  write paths are only schema-tested.

## Key decisions & trade-offs

- **Envelope encryption over at-rest-only:** stronger confidentiality; the cost
  is query limits, handled with plaintext linkage and (if needed) blind indexes.
- **No ORE/FHE:** order/range search over ciphertext leaks order (reconstruction
  attacks) and/or is slow; equality on a small set of linkage fields is enough.
- **GCS ciphertext archive over BigQuery:** BigQuery's value is plaintext
  analytics; a PHI archive must stay ciphertext and be decrypted at read.
- **FHIR-inspired, not conformant:** borrow the shapes that help interop without
  the cost of a full FHIR server.
- **Nested `CarePlan.activity[]`:** exact FHIR shape, fewer documents, archives
  with the parent.
- **Distinct storage formats + fail-closed:** prevents a silent plaintext
  downgrade of a "zero-knowledge" tenant.
- **Provider abstraction:** one codebase for a premium privacy tier and a
  regular EHR tier.

## Future directions

1. Finish resident-document two-mode encryption; then tenant-scoped mode config.
2. Migrate the remaining subcollections; backfill `resident_id` (and
   `crypto_scheme`) onto legacy documents.
3. Implement retention/archive (#3/#4/#5): `retention_ts`, GCS writer/backfill,
   rehydrate read path, scheduled truncation.
4. Break-glass emergency access via short-lived STS credentials + IAM on the real
   KEKs (see `notes/emergency_access.md`).
5. Integration tests + CI (test + typecheck).
6. Evaluate FHIR interop (HAPI / GCP Healthcare API) if a real requirement
   appears; native multi-tenancy (#1/#2).

## Known gaps / risks

- No runtime/integration tests; the unit suite is schema-level only.
- Resident document is still envelope-only.
- `CRYPTO_MODE` is process-global, not per tenant.
- Retention/archive is not implemented.
- Legacy documents need a `resident_id`/`crypto_scheme` backfill.
