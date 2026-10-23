# Resident Linkage Standardization (FHIR `Reference` + `resident_id`)

## Problem

Resident linkage across subcollections is inconsistent:

| Subcollection                          | Linkage field today                                  |
| -------------------------------------- | ---------------------------------------------------- |
| most collections                       | `resident_id`                                        |
| `accounts`, `procedures`, `encounters` | `subject.id`                                         |
| `coverages`                            | `beneficiary_id`                                     |
| `care_plan_activities`                 | `resident_id` (denormalized; was `careplan_id` only) |

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

| Subcollection (resource)            | FHIR patient link                    | Today                        |
| ----------------------------------- | ------------------------------------ | ---------------------------- |
| `observations` (Observation)        | `subject`                            | `resident_id`                |
| `allergies` (AllergyIntolerance)    | `patient`                            | `resident_id`                |
| `diagnostic_history` (Condition)    | `subject`                            | `resident_id`                |
| `prescriptions` (MedicationRequest) | `subject`                            | `resident_id`                |
| `emar` (MedicationAdministration)   | `subject`                            | `resident_id`                |
| `procedures` (Procedure)            | `subject`                            | `subject.id`                 |
| `encounters` (Encounter)            | `subject`                            | `subject.id`                 |
| `episodes_of_care` (EpisodeOfCare)  | `patient`                            | `resident_id`                |
| `care_plans` (CarePlan)             | `subject`                            | `resident_id`                |
| `goals` (Goal)                      | `subject`                            | `resident_id`                |
| `tasks` (Task)                      | `for`                                | `resident_id`                |
| `accounts` (Account)                | `subject`                            | `subject.id`                 |
| `charges` (ChargeItem)              | `subject`                            | `resident_id`                |
| `claims` (Claim)                    | `patient`                            | `resident_id`                |
| `coverages` (Coverage)              | `beneficiary`                        | `beneficiary_id`             |
| `care_plan_activities`              | `CarePlan.activity` (nested in FHIR) | `resident_id` (denormalized) |

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

### 4. `care_plan_activities` (no direct resident link) — done

FHIR models `CarePlan.activity` as nested inside `CarePlan`, so it has no
patient link of its own. Because it is a subcollection here, `resident_id` is now
**denormalized onto it at write time** (copied from the parent `care_plans`
document), with `careplan_id` kept as the back-reference. The activity schema was
also normalized to FHIR `CarePlan.activity.detail` (`kind`, `code`, `status`,
`do_not_perform`, `scheduled_timing`, `performer[]`, `description`).

## Migration path

1. Add `Reference` schema.
2. Add plaintext `resident_id` to every subcollection `schemas` +
   `encrypted-schemas` definition.
3. Update converters/decryptors to return the FHIR `Reference` shape while
   preserving the plaintext `resident_id`.
4. Backfill existing documents: set `resident_id` from `subject.id` /
   `beneficiary_id` / a `careplan_id → care_plans` join where missing.
   (`care_plan_activities` denormalization is done.)
5. Use `resident_id` (+ `retention_ts`) as the GCS archive object-path / blind
   index segments.

## Acceptance criteria

- Every resident subcollection document carries a plaintext `resident_id`.
- Domain objects reference the resident via FHIR `Reference`
  (`subject` / `patient` / `beneficiary` / `for`) with no ad-hoc id fields.
- `care_plan_activities` resolves its resident without joining `care_plans`.
- GCS archive objects are keyed by a consistent `resident_id` (+ `retention_ts`).

## Tracking

- [#6 — Refactor: standardize resident linkage to FHIR Reference + denormalized resident_id](https://github.com/Dan6200/ehr-infrastructure/issues/6)
