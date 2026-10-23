/**
 * Crypto provider contract. The storage layer depends on this interface, not on
 * a concrete KMS implementation, so a second (plaintext) mode can be added
 * without forking the application.
 *
 * See `notes/decoupling_and_reuse.md` and issue #7.
 */

export type CryptoScheme = 'kms-envelope:v1'

export interface DataKey {
  plaintextDek: Buffer
  encryptedDek: Buffer | string | Uint8Array
}

export interface EncryptedField {
  ciphertext: string
  iv: string
  authTag: string
}

export interface CryptoProvider {
  readonly scheme: CryptoScheme
  generateDataKey(kekPath: string): Promise<DataKey>
  decryptDataKey(
    encryptedDek: Buffer | string | Uint8Array,
    kekPath: string,
  ): Promise<Buffer | string | Uint8Array>
  encryptData(
    plaintext: string,
    plaintextDek: Buffer | string | Uint8Array,
  ): EncryptedField
  decryptData(
    encryptedData: EncryptedField,
    plaintextDek: Buffer | string | Uint8Array,
  ): string
}
