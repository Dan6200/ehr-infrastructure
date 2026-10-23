# Data Retention & Encrypted Archive (GCS) Offload (Assisted Living)

## Problem

Firestore documents in the Assisted Living module are growing too large. The
resident subcollections under `providers/{providerId}/residents/{residentId}`
(e.g. `charges`, `claims`, `payments`, `adjustments`, `observations`, `emar`,
`prescriptions`, etc.) grow unboundedly over time. Reading them in full on the
residents table and individual resident pages causes large reads and, at
scale, `RESOURCE_EXHAUSTED` errors.

## Goal

Truncate Firestore data older than a configurable retention window, **archive
it to GCS as envelope-encrypted blobs**, and **rehydrate** (read + decrypt)
older data on demand from the app.

BigQuery is **not** the archive for PHI. It remains the analytics store for the
existing financial aggregation only.

### Scope

- **In scope:** table data (residents list) and individual resident pages
  (all resident subcollections).
- **Out of scope:** dashboard data (already BigQuery-backed financial
  aggregation via `lib/bigquery/queries.ts`).
- **Explicitly out of scope:** shipping decrypted PHI to BigQuery. The existing
  `charges_raw` / `claims_raw` / `payments_raw` / `adjustments_raw` financial
  pipeline is unchanged for dashboard analytics, but it is **not** expanded to
  clinical/contact collections.

## Decisions

| Decision             | Choice                                    | Notes                                                                                       |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Retention window     | Configurable via env var `RETENTION_DAYS` | Default `90` days. Older data is archived to GCS and truncated from Firestore.              |
| Archive store        | GCS (envelope-encrypted)                  | Ciphertext only; decrypted at read time (rehydration).                                      |
| BigQuery role        | Financial analytics only (existing)       | Not a PHI archive.                                                                          |
| Truncation mechanism | Scheduled Cloud Function                  | Deletes Firestore docs older than the cutoff only after they are confirmed archived in GCS. |

## Data model mapping

Each subcollection needs two pieces of plaintext metadata that serve as the
archive's **blind index** (the object path) and retention filter:

1. **Resident linkage field** — ties a row back to a resident so archived
   objects can be located by `resident_id` in the GCS path.
2. **Retention anchor field** — the timestamp used to compute a document's age
   (whether it is older than the retention cutoff).

| Subcollection        | Resident linkage                      | Retention anchor       |
| -------------------- | ------------------------------------- | ---------------------- |
| `charges`            | `resident_id`                         | `occurrence_datetime`  |
| `claims`             | `resident_id`                         | `authored_on`          |
| `payments`           | `resident_id`                         | `occurrence_datetime`  |
| `adjustments`        | `resident_id`                         | `authored_on`          |
| `accounts`           | `resident_id` (from `subject.id`)     | `authored_on`          |
| `coverages`          | `resident_id` (from `beneficiary_id`) | `authored_on`          |
| `allergies`          | `resident_id`                         | `recorded_date`        |
| `prescriptions`      | `resident_id`                         | `period.start`         |
| `observations`       | `resident_id`                         | `effective_datetime`   |
| `diagnostic_history` | `resident_id`                         | `recorded_date`        |
| `emar`               | `resident_id`                         | `effective_datetime`   |
| `care_plans`         | `resident_id`                         | `created_date`         |
| `goals`              | `resident_id`                         | Firestore `createTime` |
| `procedures`         | `resident_id` (from `subject.id`)     | `recorded_at`          |
| `tasks`              | `resident_id`                         | `authored_on`          |
| `encounters`         | `resident_id` (from `subject.id`)     | `recorded_at`          |
| `episodes_of_care`   | `resident_id`                         | `period.start`         |
| `identifiers`        | `resident_id`                         | `issued`               |
| `addresses`          | `resident_id`                         | Firestore `createTime` |
| `emergency_contacts` | `resident_id`                         | Firestore `createTime` |

> **Note:** every retention anchor listed above is currently encrypted at rest
> (or, for the four `createTime` entries, not a stored field at all). Both cases
> require a plaintext, indexed timestamp field to be added before retention
> filtering is possible — see "Known complications" #1 and #2.

## Tracking

- [#3 — Retention-based hybrid Firestore + encrypted GCS archive reads](https://github.com/Dan6200/ehr-infrastructure/issues/3)
- [#4 — Archive encrypted resident subcollections to GCS](https://github.com/Dan6200/ehr-infrastructure/issues/4)
- [#5 — Scheduled Firestore truncation Cloud Function for data retention](https://github.com/Dan6200/ehr-infrastructure/issues/5)

### Dependencies

- [#6 — Refactor: standardize resident linkage to FHIR Reference + denormalized resident_id](https://github.com/Dan6200/ehr-infrastructure/issues/6)
  (standalone refactor; see
  [`resident_linkage_standardization.md`](resident_linkage_standardization.md)).
  The GCS object-path partitioning in #4 depends on a consistent `resident_id`.

## Components

1. **Plaintext blind-index fields.** Add plaintext `resident_id` (done for
   `accounts`/`coverages`/`procedures`/`encounters`) and a plaintext
   `retention_ts` to every subcollection document. Needed for the Firestore
   "recent" query, for truncation selection, and for the GCS object path.

2. **Archive writer.** Copy documents older than the cutoff to GCS as
   ciphertext. Object path:
   `providers/{providerId}/residents/{residentId}/{collection}/{retention_ts}/{docId}.json`.
   Object content = the encrypted Firestore document (`EncryptedXSchema`) plus
   plaintext `resident_id` and `retention_ts` (the blind index).

3. **Rehydration read path.** Update `getNestedResidentData` (and, as needed,
   `getResidents` / `getResidentData`) to:
   - read recent documents from Firestore (`retention_ts >= cutoff`),
   - list + download GCS objects older than the cutoff
     (`retention_ts < cutoff`) for that resident + collection,
   - decrypt both with the **same** converters and merge the union.

4. **Backfill.** One-time script to archive existing Firestore documents that
   are already older than the cutoff.

5. **Scheduled truncation function.** Deletes Firestore documents older than
   the cutoff, only after the corresponding GCS object is confirmed written.

6. **BigQuery (unchanged).** Remains the plaintext financial aggregation store
   for the dashboard; no clinical/contact data is streamed to it.

## Known complications

### 1. Retention anchors are encrypted at rest (biggest blocker)

The fields we need to filter on are encrypted in Firestore. For example:

- `charges.occurrence_datetime` is stored as `encrypted_occurrence_datetime`
- `observations.effective_datetime` is stored as `encrypted_effective_datetime`
- `allergies.recorded_date` is stored as `encrypted_recorded_date`

Firestore `.where()` queries operate on raw document fields, so **you cannot
filter subcollection documents by their event date** — the value is ciphertext.
This breaks the Firestore "recent" query and the truncation function's selection
query.

**Implication:** every subcollection document must gain a **plaintext, indexed
timestamp field** (`retention_ts`, a duplicate of the event date kept
unencrypted). This is a schema change plus a one-time migration/backfill to
populate it on existing documents. It also means storing a small amount of
event-time metadata in plaintext, which must be acceptable from a
data-minimization standpoint.

### 2. Firestore metadata is not queryable

`doc.createTime` / `doc.updateTime` are snapshot metadata, not stored fields, so
they **cannot** be used in a `.where()` or `.orderBy()`. The date-less
collections (`emergency_contacts`, `goals`, `addresses`)
default to `createTime`, but that default is unworkable for queries and TTL.
Those collections must instead have a real plaintext `retention_ts` field
written at insert time (or backfilled from `createTime` during the migration).

### 3. Inconsistent resident linkage

Most collections use `resident_id`, but some use other shapes (see the mapping
above). The GCS object path needs a single `resident_id` segment, so these must
be normalized. `CarePlan.activity` is now stored nested inside the care plan
document (FHIR-exact), so it archives/truncates with its parent and has no
separate linkage. Remaining linkage work is tracked in #6.

### 4. `care_plan_activities` — nested (resolved)

`CarePlan.activity` is stored nested on the care plan document as
`activity: [{ id, detail }]` (FHIR-exact), so there is no separate subcollection
and no separate archive entry; it is retained/truncated with its parent.

### 5. GCS object layout and listing (no SQL)

GCS has no server-side filtering or aggregation — the archive is only
addressable by object prefix. The blind index (`resident_id` + `retention_ts`
in the path) must be enough to enumerate "all docs for this resident older than
the cutoff" via a prefix listing. Object listing is paginated and not
transactional; the read path must handle partial/retry listings.

### 6. Key rotation and DEK reuse across archived blobs

Each archived object carries its own wrapped DEK, so it stays decryptable as
long as the KMS KEK version used to wrap that DEK is retained. Define a KEK
version-retention policy so old archives never become undecryptable after key
rotation.

### 7. Rehydration latency

Reading old data = a GCS `GET` + KMS decrypt per document, slower than a
Firestore read. This is acceptable for rarely-viewed cold data, but consider
batching (e.g. one object per resident + collection + retention period instead
of per-document) to reduce round-trips.

### 8. Truncation ordering and data-loss safety

The truncation function must only delete a Firestore document after its GCS
object write has been acknowledged. The archive writer should be
at-least-once with a confirmation check (object exists before delete), otherwise
a failed archive write followed by truncation loses data permanently.

### 9. Pagination and ordering across two stores

- Subcollection pages currently read the full collection with no pagination, so
  merging a Firestore slice (recent) with a GCS slice (old) is a union + sort by
  the retention anchor.
- The residents table (`getAllResidents`) uses **cursor pagination** with
  `orderBy('facility_id').orderBy('encrypted_resident_name')`. If the residents
  list itself is offloaded (e.g. deactivated residents older than the cutoff),
  Firestore cursors and GCS object listing do not compose — the merge/ordering
  strategy must be defined explicitly before that page is moved off Firestore.

### 10. Indexing

Once plaintext `retention_ts` exists, a single-field `.where(retention_ts >=
cutoff)` needs only the automatic single-field index. But any query that also
filters by another field or orders by a second field will require a **composite
index** (declared in `firestore.indexes.json`). The read path and truncation
function must be designed so their queries are indexable, and the indexes
deployed before the code ships.
