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

> **Note:** every retention anchor listed above is currently encrypted at rest
> (or, for the four `createTime` entries, not a stored field at all). Both cases
> require a plaintext, indexed timestamp field to be added before retention
> filtering is possible — see "Known complications" #1 and #2.

## Tracking

- [#3 — Retention-based hybrid Firestore + BigQuery reads for table and resident pages](https://github.com/Dan6200/ehr-infrastructure/issues/3)
- [#4 — Extend BigQuery streaming + backfill to all resident subcollections](https://github.com/Dan6200/ehr-infrastructure/issues/4)
- [#5 — Scheduled Firestore truncation Cloud Function for data retention](https://github.com/Dan6200/ehr-infrastructure/issues/5)

### Dependencies

- [#6 — Refactor: standardize resident linkage to FHIR Reference + denormalized resident_id](https://github.com/Dan6200/ehr-infrastructure/issues/6)
  (standalone refactor; see
  [`resident_linkage_standardization.md`](resident_linkage_standardization.md)).
  The BigQuery `resident_id` normalization in #4 depends on this.

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

### 1. Retention anchors are encrypted at rest (biggest blocker)

The fields we need to filter on are encrypted in Firestore. For example:

- `charges.occurrence_datetime` is stored as `encrypted_occurrence_datetime`
- `observations.effective_datetime` is stored as `encrypted_effective_datetime`
- `allergies.recorded_date` is stored as `encrypted_recorded_date`

Firestore `.where()` queries operate on raw document fields, so **you cannot
filter subcollection documents by their event date** — the value is ciphertext.
This breaks two parts of the design:

- the hybrid read path's `retention anchor >= cutoff` Firestore query, and
- the truncation function's `retention anchor < cutoff` Firestore query.

**Implication:** every subcollection document must gain a **plaintext, indexed
timestamp field** (e.g. a duplicate `occurrence_datetime`/`effective_datetime`
kept unencrypted, or a generic `retention_ts`). This is a schema change plus a
one-time migration/backfill to populate it on existing documents. It also means
storing a small amount of event-time metadata in plaintext, which must be
acceptable from a data-minimization standpoint.

### 2. Firestore metadata is not queryable

`doc.createTime` / `doc.updateTime` are snapshot metadata, not stored fields, so
they **cannot** be used in a `.where()` or `.orderBy()`. The current plan
defaults date-less collections (`emergency_contacts`, `goals`,
`care_plan_activities`, `addresses`) to `createTime`, but that default is
unworkable for queries and TTL. Those collections must instead have a real
plaintext `created_at`/`retention_ts` field written at insert time (or backfilled
from `createTime` during the migration).

### 3. Inconsistent resident linkage

Most collections use `resident_id`, but the linkage field differs across the
board, and some rows have no resident link at all:

| Collection             | Linkage field      | Notes                                    |
| ---------------------- | ------------------ | ---------------------------------------- |
| `accounts`             | `subject.id`       | Decrypted as `{ subject: { id, name } }` |
| `coverages`            | `beneficiary_id`   | No `resident_id` field                   |
| `procedures`           | `subject.id`       |                                          |
| `encounters`           | `subject.id`       | Also has `episodes_of_care_id`           |
| `care_plan_activities` | `careplan_id` only | Must join `care_plans` → `resident_id`   |
| everything else        | `resident_id`      |                                          |

The BigQuery `*_raw` tables must normalize all of these into a single
`resident_id` column. `care_plan_activities` is the worst case: its resident
link goes through `care_plans`, which is itself subject to truncation — the
join breaks if `care_plans` rows are deleted before `care_plan_activities` can
be resolved. Resolution: denormalize `resident_id` onto `care_plan_activities`
at stream/backfill time (or order truncation so parents outlive children).

### 4. `care_plan_activities` decryptor contract mismatch

The generic `getSubcollection` helper passes each document as
`{ id: doc.id, ...doc.data() }`, but `decryptCarePlanActivity` reads
`data.document_id` (see `types/converters/residents/care-plan-activities.ts`).
This is a latent inconsistency that will surface as `document_id === undefined`
when the offload path is built; the converter must be aligned with the generic
`id` contract (or given its own adapter) before this collection can be
streamed/queried from BigQuery.

### 5. Role-based decryption vs. plaintext in BigQuery

- Resident-level fields are **role-gated**: `decryptResidentData` only decrypts
  the DEK for a KEK if the caller's role allows it (general/contact/clinical).
- Subcollection decryptors (`decryptCharge`, `decryptObservation`, …) are **not**
  role-gated today — they decrypt everything given the right KEK path.

Serving decrypted rows from BigQuery places PHI (clinical, contact, financial)
in BigQuery as plaintext and removes any future ability to gate decryption by
role at read time. This requires: BigQuery-level access control (dataset/table
IAM), tenant isolation (see #6), and an explicit decision that BigQuery is an
approved plaintext PHI store.

### 6. Multi-tenancy / provider scoping in BigQuery

Current `*_raw` tables are effectively **shared across providers**: the
streaming functions insert `resident_id` but no `provider_id`, the dashboard
aggregation query sums across all providers, and the backfill script hardcodes
`PROVIDER_ID = 'GYRHOME'`. For resident-page offload the queries must be scoped
per provider (or rely on globally-unique `resident_id`), and truncation must not
cross tenant boundaries. Consider adding a `provider_id` column to each `*_raw`
table and filtering on it in the read path.

### 7. Data-type / shape parity between Firestore and BigQuery rows

The converters perform type coercion and JSON parsing that the BigQuery rows
must reproduce exactly, otherwise Zod parsing and the UI break. Examples:

- `charges.unit_price`: `JSON.parse` + `parseFloat(value.toFixed(2))`
- `charges.quantity`: `parseInt`
- `observations.value`: `parseFloat`
- `allergies.name` / `substance` / `reaction`: `JSON.parse`
- nested objects (`CodeableConcept`, `Quantity`, `Period`) must map to BigQuery
  `RECORD`/`STRUCT` columns with matching field names.

The existing financial `*_raw` tables already handle part of this; the same
shape-normalization has to be built for every additional collection, and the
hybrid read path must return Firestore-identical shapes from both sources.

### 8. Truncation ordering and data-loss safety

`streamToBigQuery` currently catches errors, logs, and continues — there is no
retry, acknowledgement, or dead-letter. If truncation deletes a document whose
stream insert failed, the data is lost permanently. The truncation function
must only delete a document after confirming it exists in BigQuery (e.g. query
the `*_raw` table for the normalized `resident_id` + `id`), and/or the streaming
path must become retryable with an at-least-once guarantee before truncation is
enabled.

### 9. Pagination and ordering across two stores

- Subcollection pages currently read the full collection with no pagination, so
  merging a Firestore slice (recent) with a BigQuery slice (old) is a simple
  union + sort by the retention anchor.
- The residents table (`getAllResidents`) uses **cursor pagination** with
  `orderBy('facility_id').orderBy('encrypted_resident_name')`. If the residents
  list itself is offloaded (e.g. deactivated residents older than the cutoff),
  Firestore cursors and BigQuery keyset/offset pagination do not compose — the
  merge/ordering strategy must be defined explicitly before that page is moved
  off Firestore.

### 10. Indexing

Once plaintext retention timestamps exist, a single-field `.where(timestamp >=
cutoff)` needs only the automatic single-field index. But any query that also
filters by another field or orders by a second field will require a **composite
index** (declared in `firestore.indexes.json`). The read path and truncation
function must be designed so their queries are indexable, and the indexes
deployed before the code ships.
