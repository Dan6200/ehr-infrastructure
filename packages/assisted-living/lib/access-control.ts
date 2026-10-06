// Cryptographic role-based access control.
//
// Each KEK class (general/contact/clinical/financial) can only be unwrapped by
// certain roles. This mirrors the role-gating in
// `types/converters/residents/main.ts` (`decryptResidentData`) and is the single
// source of truth for which roles may decrypt which class of data.
//
// This module is deliberately domain-agnostic: it knows about KEK classes and
// roles, not about residents or assisted living. See
// `notes/decoupling_and_reuse.md`.

export type KekType = 'general' | 'contact' | 'clinical' | 'financial'

export const KEK_TYPE_ROLES: Record<KekType, readonly string[]> = {
  general: ['ADMIN', 'CLINICIAN', 'CAREGIVER', 'VIEWER'],
  contact: ['ADMIN', 'CLINICIAN', 'CAREGIVER'],
  clinical: ['ADMIN', 'CLINICIAN'],
  financial: ['ADMIN'],
}

/** Returns true if any of `roles` is authorized to unwrap `kekType`. */
export function canAccessKekType(
  roles: string[] | undefined,
  kekType: KekType,
): boolean {
  const upper = (roles ?? []).map((role) => role.toUpperCase())
  return KEK_TYPE_ROLES[kekType].some((allowed) => upper.includes(allowed))
}
