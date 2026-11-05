import * as crypto from 'crypto'
import type { CryptoProvider } from '#root/lib/crypto/types'

/**
 * Test-only crypto provider.
 *
 * Replaces Cloud KMS so integration tests can run against the Firestore
 * emulator with no GCP credentials. It performs real AES-256-GCM with a single
 * fixed DEK, so encrypt/decrypt round-trips behave like production minus KMS.
 */
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const FAKE_DEK = Buffer.alloc(32, 1)
const FAKE_WRAPPED_DEK = Buffer.from('fake-wrapped-dek')

export const fakeCryptoProvider: CryptoProvider = {
  scheme: 'kms-envelope:v1',
  async generateDataKey() {
    return { plaintextDek: FAKE_DEK, encryptedDek: FAKE_WRAPPED_DEK }
  },
  async decryptDataKey() {
    return FAKE_DEK
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
