'server-only'
import { getCryptoProvider } from './crypto'
import type { EncryptedField } from './crypto/types'

export { kmsClient } from './crypto/kms-envelope-provider'

export const KEK_GENERAL_PATH = process.env.KEK_GENERAL_PATH!
export const KEK_CONTACT_PATH = process.env.KEK_CONTACT_PATH!
export const KEK_CLINICAL_PATH = process.env.KEK_CLINICAL_PATH!
export const KEK_FINANCIAL_PATH = process.env.KEK_FINANCIAL_PATH!

if (
  !KEK_GENERAL_PATH ||
  !KEK_CONTACT_PATH ||
  !KEK_CLINICAL_PATH ||
  !KEK_FINANCIAL_PATH
) {
  console.warn(
    'One or more KEK_PATH environment variables are not set. Decryption/Encryption may fail in deployed environments if these are not explicitly provided.',
  )
}

// --- DEK Generation and Wrapping/Unwrapping ---

export async function generateDataKey(kekPath: string) {
  return getCryptoProvider().generateDataKey(kekPath)
}

export async function decryptDataKey(
  encryptedDek: Buffer | string | Uint8Array,
  kekPath: string,
) {
  return getCryptoProvider().decryptDataKey(encryptedDek, kekPath)
}

// --- Data Encryption and Decryption ---

export function encryptData(
  plaintext: string,
  plaintextDek: Buffer | string | Uint8Array,
): EncryptedField {
  return getCryptoProvider().encryptData(plaintext, plaintextDek)
}

export function decryptData(
  encryptedData: EncryptedField,
  plaintextDek: Buffer | string | Uint8Array,
): string {
  return getCryptoProvider().decryptData(encryptedData, plaintextDek)
}
