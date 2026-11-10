# Handoff — Assisted Living module

Purpose: give the next agent enough context to continue without re-deriving the
history. `architecture.md` is the design reference; this file is the state +
next steps.

## TL;DR

- **Envelope encryption mode is production behaviour.** The two-mode crypto work
  (#7) is partially done: the provider abstraction and 7 subcollections support a
  distinct plaintext mode; the **resident document is still envelope-only**, so
  `CRYPTO_MODE=plaintext` is not a coherent end-to-end tenant yet.
- **Tests are green:** 63 unit, 28 Firestore-emulator integration,
  `tsc --noEmit` clean.
- **Retention/archive (#3/#4/#5) is not implemented.**
- Several audit-found bugs are open: #11 (delete cascade), #12 (add validation),
  #13 (role-gated reads throw), #15 (DEK rotation on partial resident update),
  plus #14 (CI + real-KMS test).

## Architecture (short)

- Next.js 15 + Firebase Admin + Firestore; KMS; Redis; BigQuery (financial
  analytics); Cloud Run. SNOMED via self-hosted Snowstorm-Lite; LOINC/RxNorm via
  BigQuery.
- Firestore: `providers/{providerId}/residents/{residentId}/{subcollection}`.
- **FHIR-inspired, not conformant.** Domain objects use FHIR `Reference`
  (`subject`/`patient`/`beneficiary`/`for`); storage keeps plaintext
  `resident_id`. `CarePlan.activity[]` is nested (with `detail`), not a
  subcollection.
- **Crypto:** `lib/crypto` defines `CryptoProvider`; `KmsEnvelopeProvider` is
  default, `PlaintextProvider` is the regular-EHR mode. `CRYPTO_MODE` selects one
  and fails closed on unknown values. Plaintext documents use a structurally
  distinct shape stamped `crypto_scheme: 'none:v1'`; reads verify the scheme and
  fail closed on mismatch.
- See `architecture.md` for details, decisions, and trade-offs.

## What is done

Data model / FHIR

- FHIR `Reference` schema; `resident_id` denormalized for accounts/coverages/
  procedures/encounters; FHIR `Reference` rename across 17 domain schemas.
- `care_plan_activities` normalized to FHIR `CarePlan.activity.detail`, then
  moved to nested `CarePlan.activity[]` (subcollection removed).

Security

- Fixed subcollection reads authenticating but not authorizing; added
  `lib/access-control.ts` (role → KEK-class matrix) and enforced it in reads.
- **#10 (closed):** every write action now authorizes the role before persisting
  (clinical → ADMIN/CLINICIAN; financial → ADMIN; contact →
  ADMIN/CLINICIAN/CAREGIVER; resident update is field-aware).

Two-mode crypto (#7, partial)

- `CryptoProvider` interface, KMS + plaintext providers, factory, Docker copies.
- Distinct-format codec for **allergies, observations, diagnostic_history,
  prescriptions, charges, payments, adjustments**: union storage schema,
  scheme-aware read dispatch (fail closed), mode-branched writes, envelope
  `crypto_scheme` stamp, plaintext writes skip KMS.

Bugs fixed along the way

- #8/#9: clinical/eMAR writes missing `resident_id`/`recorder_id`/`encrypted_dek`.
- Observations decryptor never parsed `category`/`code`/`value_quantity`.
- Prescriptions decryptor used `dosageInstruction` (wrong key) and never parsed
  `period`.
- Payments/adjustments wrote optional `claim_id`/`coverage_id` as `undefined`
  (Firestore rejects).
- Plaintext writes for the migrated collections no longer fetch the resident DEK.
- Removed stale emergency-access stubs and dead tests; fixed `--webapack` typo.

Tests/tooling

- `pnpm test` (unit, no emulator), `pnpm typecheck`, `pnpm test:integration`
  (Firestore emulator).
- Integration harness: `test-data/emulatorSetup.ts`, `test-data/fakeCrypto.ts`
  (rotation-aware), `test-data/integrationSetup.ts`, `jest.integration.config.ts`,
  `firebase.emulator.json` (port **8181**).
- 20+ integration tests cover resident CRUD, role/provider gating, fail-closed
  scheme mismatches, all form-backed write actions, plaintext read/write, and
  write authorization. #15 is encoded as an `it.failing` test.

Docs

- `architecture.md`, refreshed `README.md`, `notes/data_retention_and_gcs_archive.md`,
  `notes/resident_linkage_standardization.md`, `notes/decoupling_and_reuse.md`,
  plus terminology/Snowstorm coverage.

## Open work (priority order)

1. **#11 — `deleteResidentData` leaves orphaned subcollections** (high, security).
   Use `recursiveDelete`.
2. **#12 — `addNewResident` doesn't validate required fields** (medium).
   Missing `room_no`/`dob`/`pcp` can persist an unreadable resident.
3. **#13 — role-gated resident reads throw instead of redacting** (medium).
   CAREGIVER/VIEWER get an error instead of a partial record.
4. **#15 — `updateResident` rotates DEKs on partial updates** (high).
   Unmodified fields become undecryptable in real KMS. Needs design: reuse
   existing DEKs, re-encrypt everything, or version DEKs. The rotation-aware fake
   provider now reproduces it (`it.failing` test).
5. **#14 — CI gate + real-KMS smoke test** (medium). Run typecheck/unit/integration
   in CI; add a staging smoke test exercising real KMS IAM/key versions.
6. **#7 remainder** (large). Resident-document two-mode; tenant-scoped mode
   config (currently a global `CRYPTO_MODE`); migrate the remaining ~13
   subcollections; backfill `crypto_scheme`.
7. **#6 remainder** (small). One-time `resident_id` backfill for legacy docs
   (decryptors fall back at read time).
8. **#3/#4/#5 retention/archive** (large). `retention_ts`, GCS ciphertext archive
   - backfill, rehydrate read path, scheduled truncation. BigQuery stays
     financial-analytics-only.

## Gotchas / environment

- **Emulator ports:** main `firebase.json` uses 8080, but it was occupied (local
  `qstash`), so integration tests use `firebase.emulator.json` on **8181**. The
  emulator needs Java.
- **`verifySession` is mocked** in integration tests; auth itself isn't exercised.
- **Fake crypto provider is rotation-aware:** each `generateDataKey` issues a
  distinct DEK; the wrapped value is the DEK. It will not catch KMS IAM/versioning
  issues — that needs a real-KMS test.
- `server-only` is mapped to `test-data/empty.ts` in both Jest configs; without
  it, importing `lib/encryption` in tests throws.
- `getAdminDb` requires `NEXT_PUBLIC_DATABASE_ID`; `integrationSetup.ts` sets it
  (`staging-beta`).
- **Do not commit** the pre-existing dirty `packages/assisted-living/firestore.indexes.json`
  or the untracked `AGENTS.md` unless the task is about them.
- `dev` script is `next dev --webpack` (the earlier `--webapack` typo is fixed).
- `demo-data/` is gitignored; care-plan activities are nested (local demo data
  was transformed, not committed).

## Suggested first move

Close **#11** (small, security): switch `deleteResidentData` to
`recursiveDelete`, add an integration test that no subcollection docs remain, run
`pnpm typecheck && pnpm test && pnpm test:integration`, commit. Then pick up #12/
#13 or the design for #15.
