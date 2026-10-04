# Data Retention & BigQuery Offload (Assisted Living)

## Problem

Firestore documents in the Assisted Living module are growing too large. The
resident subcollections under `providers/{providerId}/residents/{residentId}`
(e.g. `charges`, `claims`, `payments`, `adjustments`, `observations`, `emar`,
`prescriptions`, etc.) grow unboundedly over time. Reading them in full on the
residents table and individual resident pages causes large reads and, at
scale, `RESOURCE_EXHAUSTED` errors.

## Goal

Truncate Firestore data older than a configurable retention window and serve
that older data from BigQuery instead.

### Scope

- **In scope:** table data (residents list) and individual resident pages
  (all resident subcollections).
- **Out of scope:** dashboard data. The dashboard already reads from BigQuery
  via `lib/bigquery/queries.ts` (`charges_raw`, `claims_raw`, `payments_raw`,
  `adjustments_raw`, `resident_timestamps_raw`).

## Decisions

| Decision             | Choice                                     | Notes                                                                                                                                                                      |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retention window     | Configurable via env var `RETENTION_DAYS`  | Default `90` days. Older data is truncated from Firestore and served from BigQuery.                                                                                        |
| BigQuery scope       | All subcollections shown on resident pages | Includes clinical, financial, contact, and administrative subcollections. Today only `charges`, `claims`, `payments`, `adjustments`, and resident timestamps are streamed. |
| Truncation mechanism | Scheduled Cloud Function                   | A Firebase Scheduled Function periodically deletes Firestore documents older than the cutoff after they have been streamed to BigQuery.                                    |

## Data model mapping

Each subcollection needs two pieces of metadata for retention and BigQuery
offload:

1. **Resident linkage field** — the field that ties a row back to a resident
   so older rows can be queried from BigQuery per resident.
2. **Retention anchor field** — the timestamp used to compute a document's age
   (whether it is older than the retention cutoff).

| Subcollection          | Resident linkage                             | Retention anchor       |
| ---------------------- | -------------------------------------------- | ---------------------- |
| `charges`              | `resident_id`                                | `occurrence_datetime`  |
| `claims`               | `resident_id`                                | `authored_on`          |
| `payments`             | `resident_id`                                | `occurrence_datetime`  |
| `adjustments`          | `resident_id`                                | `authored_on`          |
| `accounts`             | `subject.id`                                 | `authored_on`          |
| `coverages`            | `beneficiary_id`                             | `authored_on`          |
| `allergies`            | `resident_id`                                | `recorded_date`        |
| `prescriptions`        | `resident_id`                                | `period.start`         |
| `observations`         | `resident_id`                                | `effective_datetime`   |
| `diagnostic_history`   | `resident_id`                                | `recorded_date`        |
| `emar`                 | `resident_id`                                | `effective_datetime`   |
| `care_plans`           | `resident_id`                                | `created_date`         |
| `care_plan_activities` | via `careplan_id` → `care_plans.resident_id` | Firestore `createTime` |
| `goals`                | `resident_id`                                | Firestore `createTime` |
| `procedures`           | `subject.id`                                 | `recorded_at`          |
| `tasks`                | `resident_id`                                | `authored_on`          |
| `encounters`           | `subject.id`                                 | `recorded_at`          |
| `episodes_of_care`     | `resident_id`                                | `period.start`         |
| `identifiers`          | `resident_id`                                | `issued`               |
| `addresses`            | `resident_id`                                | Firestore `createTime` |
| `emergency_contacts`   | `resident_id`                                | Firestore `createTime` |

## Tracking

- [#3 — Retention-based hybrid Firestore + BigQuery reads for table and resident pages](https://github.com/Dan6200/ehr-infrastructure/issues/3)
- [#4 — Extend BigQuery streaming + backfill to all resident subcollections](https://github.com/Dan6200/ehr-infrastructure/issues/4)
- [#5 — Scheduled Firestore truncation Cloud Function for data retention](https://github.com/Dan6200/ehr-infrastructure/issues/5)

## Components

1. **BigQuery streaming (extend).** Add `onDocumentWritten` triggers for every
   subcollection so decrypted plaintext is streamed to a per-collection `*_raw`
   table. Normalize the resident linkage field into a consistent
   `resident_id` column (extracting from `subject.id` / `beneficiary_id`
   where needed; `care_plan_activities` resolves through `careplan_id`).

2. **Backfill (extend).** Extend `functions/src/backfill-bigquery.ts` to cover
   all subcollections, mirroring the streaming logic.

3. **BigQuery queries (new).** Per-subcollection SQL in `lib/bigquery/queries.ts`
   to fetch rows for a single `resident_id` older than the retention cutoff.

4. **Hybrid read path (new).** Update `getNestedResidentData` (and, as needed,
   `getResidents` / `getResidentData`) to:
   - read recent documents from Firestore (`retention anchor >= cutoff`), and
   - read older documents from BigQuery (`retention anchor < cutoff`),
   - merge and return the union.

5. **Scheduled truncation function (new).** A Firebase Scheduled Function that
   deletes Firestore documents whose retention anchor is older than the cutoff,
   across every resident subcollection.

## Known complications

- **Resident linkage is inconsistent.** Most collections use `resident_id`,
  but `accounts`/`procedures`/`encounters` use `subject.id`, `coverages` uses
  `beneficiary_id`, and `care_plan_activities` has no direct resident link and
  must be joined through `care_plans`.
- **Some collections have no date field** (`emergency_contacts`, `goals`,
  `care_plan_activities`, `addresses`). These fall back to the Firestore
  document `createTime` (server metadata) as the retention anchor.
- **Encryption.** Firestore stores encrypted documents (`encrypted_*` fields +
  `encrypted_dek`). Decryption must happen before streaming to BigQuery, exactly
  as the existing financial streaming functions do.
- **Truncation ordering.** The scheduled function must only delete a document
  after it has been successfully written to BigQuery to avoid data loss.
