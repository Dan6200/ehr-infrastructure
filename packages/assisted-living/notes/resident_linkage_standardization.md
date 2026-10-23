# Resident Linkage Standardization (FHIR `Reference` + `resident_id`)

## Problem

Resident linkage across subcollections is inconsistent:

| Subcollection                          | Linkage field today                                |
| -------------------------------------- | -------------------------------------------------- |
| most collections                       | `resident_id`                                      |
| `accounts`, `procedures`, `encounters` | `subject.id`                                       |
| `coverages`                            | `beneficiary_id`                                   |
| `care_plan_activities`                 | nested in `CarePlan.activity[]` (no separate link) |

This blocks the data-retention / encrypted GCS archive offload (see
[#3](https://github.com/Dan6200/ehr-infrastructure/issues/3),
[#4](https://github.com/Dan6200/ehr-infrastructure/issues/4),
[#5](https://github.com/Dan6200/ehr-infrastructure/issues/5)), because the GCS
object path needs a single normalized `resident_id` segment. It also conflicts
with the direction of following HL7 FHIR, which has a well-defined patient
reference model.

## Goal

Standardize resident linkage as a **standalone refactor** with two clearly
separated layers:

1. **Domain/API (FHIR).** A canonical `Reference` type used as the FHIR-named
   patient link per resource.
2. **Storage/query (Firestore + GCS archive).** A plaintext, indexed `resident_id`
   on every subcollection document for `.where()` filtering and as the GCS
   archive object-path segment.

Converters bridge the two, so the domain object is FHIR-faithful while the
storage layer stays cheap to query.

## Design

### 1. Canonical FHIR `Reference` schema

Add `types/schemas/fhir/reference.ts`:

```ts
export const ReferenceSchema = z.object({
  reference: z.string(), // e.g. "Patient/abc123"
  type: z.string().optional(), // e.g. "Patient"
  display: z.string().optional(), // resident_name, for convenience
})
```

The id is derived from `reference` (`reference.split('/').pop()`) rather than a
separate `id` string — one source of truth.

### 2. FHIR-named patient link per resource

| Subcollection (resource)            | FHIR patient link               | Today                 |
| ----------------------------------- | ------------------------------- | --------------------- |
| `observations` (Observation)        | `subject`                       | `resident_id`         |
| `allergies` (AllergyIntolerance)    | `patient`                       | `resident_id`         |
| `diagnostic_history` (Condition)    | `subject`                       | `resident_id`         |
| `prescriptions` (MedicationRequest) | `subject`                       | `resident_id`         |
| `emar` (MedicationAdministration)   | `subject`                       | `resident_id`         |
| `procedures` (Procedure)            | `subject`                       | `subject.id`          |
| `encounters` (Encounter)            | `subject`                       | `subject.id`          |
| `episodes_of_care` (EpisodeOfCare)  | `patient`                       | `resident_id`         |
| `care_plans` (CarePlan)             | `subject`                       | `resident_id`         |
| `goals` (Goal)                      | `subject`                       | `resident_id`         |
| `tasks` (Task)                      | `for`                           | `resident_id`         |
| `accounts` (Account)                | `subject`                       | `subject.id`          |
| `charges` (ChargeItem)              | `subject`                       | `resident_id`         |
| `claims` (Claim)                    | `patient`                       | `resident_id`         |
| `coverages` (Coverage)              | `beneficiary`                   | `beneficiary_id`      |
| `care_plan_activities`              | nested in `CarePlan.activity[]` | — (implied by parent) |

### 3. Denormalized storage linkage

Every subcollection document also persists a **plaintext, indexed `resident_id`**
(not the FHIR reference). This is a storage concern, not a domain concern:

- Firestore `.where('resident_id', '==', …)` and retention filtering need a raw
  field; ciphertext cannot be filtered.
- The GCS archive object path partitions on a single `resident_id` segment.
- The existing decryptors already pass through any key ending in `_id`
  (`key.endsWith('_id')` in `types/converters/residents/*`), so keeping
  `resident_id` plaintext costs nothing and stays queryable without decrypting.

Mapping between layers:

```
FHIR (domain):        subject.reference === `Patient/${resident_id}`
Storage (Firestore):  resident_id (plaintext)
Archive (GCS):        providers/{providerId}/residents/{resident_id}/…/{docId}.json
```

### 4. `care_plan_activities` — nested in the CarePlan (done)

FHIR models `CarePlan.activity` as nested inside `CarePlan`, so it has no
patient link of its own. It is now stored **nested** on the CarePlan document as
`activity: [{ id, detail }]` (FHIR-exact: `activity[].detail`), so there is no
separate subcollection and no separate linkage. The `detail` shape carries
`kind`, `code`, `status`, `do_not_perform`, `scheduled_timing`, `performer[]`,
and `description`.

## Migration path

1. Add `Reference` schema. — **done**
2. Add plaintext `resident_id` to every subcollection `schemas` +
   `encrypted-schemas` definition. — **done** (storage keeps `resident_id`;
   domain schemas no longer expose it)
3. Update converters/decryptors to return the FHIR `Reference` shape while
   preserving the plaintext `resident_id`. — **done**
4. Backfill existing documents: set `resident_id` from `subject.id` /
   `beneficiary_id` where missing. — **open** (the decryptors fall back at read
   time; `CarePlan.activity` is nested, so it needs no join)
5. Use `resident_id` (+ `retention_ts`) as the GCS archive object-path / blind
   index segments. — **open** (part of the archive work)

## Status

- **Done:** the `Reference` schema and the domain rename for 17 subcollections
  (`subject` / `patient` / `beneficiary` / `for`). Storage keeps plaintext
  `resident_id`; converters build the Reference.
  - `subject`: observations, diagnostic_history, prescriptions, emar,
    procedures, encounters, care_plans, goals, accounts, charges, payments,
    adjustments
  - `patient`: allergies, claims, episodes_of_care
  - `beneficiary`: coverages
  - `for`: tasks
- **Nested:** `care_plan_activities` is stored as `CarePlan.activity[]`
  (FHIR-exact), not a separate subcollection, so it has no separate linkage.
- **Not in the FHIR mapping (unchanged):** `emergency_contacts` (RelatedPerson
  style; still `resident_id`), `identifiers`, `addresses` (no domain
  `resident_id`).
- **Open:** pre-existing writes need a one-time backfill/verification of
  `resident_id` (`recorder_id`, `encrypted_dek`) on clinical update actions.

## Acceptance criteria

- Every resident subcollection document carries a plaintext `resident_id`.
- Domain objects reference the resident via FHIR `Reference`
  (`subject` / `patient` / `beneficiary` / `for`) with no ad-hoc id fields.
- `CarePlan.activity[]` is stored nested on the parent (no separate subcollection).
- GCS archive objects are keyed by a consistent `resident_id` (+ `retention_ts`).

## Tracking

- [#6 — Refactor: standardize resident linkage to FHIR Reference + denormalized resident_id](https://github.com/Dan6200/ehr-infrastructure/issues/6)
