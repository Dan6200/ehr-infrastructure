# Decoupling Reusable Security Primitives

## Objective

The Assisted Living module contains a rare, domain-agnostic asset: **role-gated
envelope encryption** that enforces data boundaries cryptographically (per-role
KEKs), not just with application-level `if (role)` checks. To keep the option of
repurposing this into another product (legal, HR, personal data vaults, mental
health, etc.), the security layer must stay cleanly separable from the
assisted-living domain.

This document records the reusable primitives, the threat model, and the plan
to keep them decoupled.

## Reusable primitives

| Primitive                                  | Location                                            | Notes                                                                                          |
| ------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Envelope encryption (DEK/KEK, AES-256-GCM) | `lib/encryption.ts`                                 | Already domain-agnostic (only imports KMS + `crypto`).                                         |
| Role → KEK-class access matrix             | `lib/access-control.ts`                             | Crypto RBAC boundary; single source of truth for who may unwrap each KEK class.                |
| Typed decryptor/encryptor converters       | `types/converters/residents/*`                      | Pattern is generic (encrypt/decrypt + Zod schema); the _schemas_ are the domain part.          |
| Ciphertext archive + rehydrate             | planned (GCS)                                       | Store-agnostic encrypted cold storage keyed by a blind index (`resident_id` + `retention_ts`). |
| Analytics pipeline                         | `lib/bigquery/` + `functions/src/bigquery-streams/` | Plaintext financial aggregation; reusable pattern for any analytics tier.                      |

## Threat model (who cannot see what)

The key hierarchy is the access control. Data is split into four KEK classes;
decrypting a class requires a role authorized for that class:

| KEK class   | Roles allowed                       | Examples                                                    |
| ----------- | ----------------------------------- | ----------------------------------------------------------- |
| `general`   | ADMIN, CLINICIAN, CAREGIVER, VIEWER | resident name, room, gender                                 |
| `contact`   | ADMIN, CLINICIAN, CAREGIVER         | email, phone, DOB, emergency contacts, addresses            |
| `clinical`  | ADMIN, CLINICIAN                    | prescriptions, diagnoses, observations, eMAR, care plans    |
| `financial` | ADMIN                               | accounts, charges, claims, coverages, payments, adjustments |

Invariants:

- The store (Firestore / GCS) holds **ciphertext only**. The only plaintext is
  linkage/timestamp metadata (`resident_id`, `facility_id`, `retention_ts`) that
  is not role-gated.
- A principal without unwrap capability for a KEK class cannot decrypt that
  class even with the ciphertext and wrapped DEK.
- Decryption happens at read time in the app, after the role check.

## What is domain-specific (stays in Assisted Living)

- The FHIR-inspired schemas (`types/schemas/*`) and the subcollection map
  (`types/subcollection-map.ts`).
- The residents/collection pages, forms, and server actions.
- The demo-data generators and seeding pipeline.

These may be _named_ after FHIR, but that naming is not load-bearing for the
security story.

## Pluggable crypto provider (two distinct modes)

To grow into more verticals (dental, physical therapy, cosmetics, general
practice), envelope encryption must be **optional**. But the two modes must be
**structurally distinct at the storage layer** — _not_ the same shape with the
crypto swapped. A single storage shape creates a **silent-downgrade /
mode-confusion** failure: a misconfigured regular-mode tenant would store
plaintext in a document that _looks_ encrypted, so a "zero-knowledge" tenant is
no longer zero-knowledge (an attacker wouldn't even need to decrypt).

Two implementations behind a `CryptoProvider`:

- `KmsEnvelopeProvider` — **high-privacy mode**: the existing DEK/KEK,
  role-gated KMS envelope encryption.
- `PlaintextProvider` — **regular EHR mode**: plain storage, no crypto fields.

Requirements:

1. **Distinct, self-describing formats.** Each stored document carries an
   explicit, non-secret scheme discriminator (`kms-envelope:v1` vs `none:v1`),
   and the two formats are structurally incompatible. A plaintext document can
   never be parsed as an envelope.
2. **Fail closed with cryptographic proof.** A high-privacy read must
   successfully unwrap a DEK via KMS and authenticate before returning data. A
   document without a genuine wrapped DEK cannot satisfy this, so even a
   mislabeled plaintext document fails closed rather than silently returning
   plaintext.
3. **Mode bound to the tenant, verified on read.** The mode is a tenant
   property (config/record) _and_ the document's own scheme tag; the read path
   rejects any document whose scheme does not match the tenant's mode.
4. **Optional physical separation.** High-privacy and regular tenants may live
   in distinct storage namespaces (separate Firestore database / GCS bucket), so
   the wrong mode cannot even address the other's data.
5. **Shared domain model, split persistence.** Pages and domain logic consume
   the same domain object; only the persistence codec branches on the mode. This
   keeps the "distinct paths" where they matter (storage) without forking the
   app.
6. **Shared role policy.** `lib/access-control.ts` (`canAccessKekType`) remains
   the single policy. High-privacy mode enforces it cryptographically (a role
   can't unwrap without permission); regular mode enforces it as an ordinary
   authorization check.
7. **Package, not subrepo.** Ship as a workspace package (`packages/ehr-crypto`)
   in this monorepo, not a separate git repo. Split into its own repo only when a
   separate service needs independent versioning.

Why this matters: for a security-branded product, the ability to _prove_ a
tenant is in high-privacy mode is itself a requirement (audit/compliance). One
ambiguous shape makes that impossible and creates a silent downgrade path.

This makes "zero-knowledge" a premium tier and "plain EHR" the standard tier,
from one codebase. Tracked in
[#7](https://github.com/Dan6200/ehr-infrastructure/issues/7).

## Decoupling plan

1. **Extract the crypto RBAC matrix (done).** `lib/access-control.ts` now owns
   the role → KEK-class mapping, and `actions/residents/get/subcollections.ts`
   enforces it on every subcollection read (see "Subcollection role-gating fix").

2. **Keep `lib/encryption.ts` and `lib/access-control.ts` free of domain types.**
   They import only KMS, `crypto`, and plain string types — no residents, no
   schemas. Guard against future drift (no `resident` imports here).

3. **Generalize the encrypted archive + rehydrate.** When built, model it as a
   store-agnostic service (`archive.write(blob, key)`, `archive.list(prefix)`,
   `archive.rehydrate(prefix, decryptor)`) with GCS as the first backend. The
   blind-index key (`resident_id` + `retention_ts`) is the only coupling — rename
   it conceptually to "subject id" + "event time" so it generalizes.

4. **Make converters generic over schema.** The encrypt/decrypt loop in
   `types/converters/residents/*` is identical across collections; it can become
   a generic `makeEncryptedConverter({ schema, encryptedSchema, decryptor })`.
   The per-collection files then only supply schemas + field-coercion.

5. **Document the key hierarchy as a reusable spec.** A short "encryption &
   access control" whitepaper (threat model, key ceremony, rotation policy) that
   is product-agnostic — this is the artifact that makes both a product pitch
   and a portfolio piece legible.

## Guardrails

- No domain types in `lib/encryption.ts` or `lib/access-control.ts`.
- The role → KEK-class matrix must be enforced in exactly one place per data
  path (currently `decryptResidentData` for the resident record and
  `getNestedResidentData` for subcollections), both delegating to
  `lib/access-control.ts`.
- Encryption discipline is imperative: every sensitive field must be encrypted
  explicitly. Treat `encrypted-schemas.ts` as the contract for what is (and is
  not) protected.

## Related

- `data_retention_and_gcs_archive.md` — retention/archive offload (the GCS
  rehydrate primitive).
- `resident_linkage_standardization.md` — consistent `resident_id` linkage
  (the blind-index key).
- `roles.md` — role definitions (aspirational; the crypto boundary above is the
  implemented source of truth).

## Tracking

- [#7 — Pluggable crypto provider: two-mode encryption (high-privacy vs. regular EHR)](https://github.com/Dan6200/ehr-infrastructure/issues/7)
