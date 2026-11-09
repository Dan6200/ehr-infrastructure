import * as crypto from 'crypto'
import type { CryptoProvider } from '#root/lib/crypto/types'

/**
 * Test-only crypto provider (no Cloud KMS).
 *
 * Each `generateDataKey` call issues a **distinct** DEK, and the "wrapped" value
 * is the DEK itself. That means a DEK is recoverable only from its own wrapped
 * value: overwriting a wrapped DEK (as a partial update that rotates keys does)
 * makes the ciphertext it protected undecryptable. This mirrors real KMS key
 * rotation closely enough to surface bugs like #15.
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

export const fakeCryptoProvider: CryptoProvider = {
  scheme: 'kms-envelope:v1',
  async generateDataKey() {
    const dek = crypto.randomBytes(32)
    return { plaintextDek: dek, encryptedDek: dek }
  },
  async decryptDataKey(encryptedDek) {
    return Buffer.from(encryptedDek as Uint8Array)
  },
  encryptData(plaintext, plaintextDek) {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, plaintextDek, iv)
    let encrypted = cipher.update(plaintext, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    }
  },
  decryptData(encryptedData, plaintextDek) {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      plaintextDek,
      Buffer.from(encryptedData.iv, 'base64'),
    )
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'))
    let decrypted = decipher.update(encryptedData.ciphertext, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  },
}
