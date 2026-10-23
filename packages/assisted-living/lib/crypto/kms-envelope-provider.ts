import { KeyManagementServiceClient } from '@google-cloud/kms'
import * as crypto from 'crypto'
import type { CryptoProvider, DataKey, EncryptedField } from './types'

const kmsClient = new KeyManagementServiceClient()

// --- DEK Generation and Wrapping/Unwrapping ---

/**
 * Generates a new Data Encryption Key (DEK) and encrypts it with the specified KEK.
 * @param kekPath The name of the KEK to use for wrapping the DEK.
 * @returns The plaintext DEK and the KEK-wrapped DEK.
 */
async function generateDataKey(kekPath: string): Promise<DataKey> {
  const plaintextDek = crypto.randomBytes(32)
  const [encryptResponse] = await kmsClient.encrypt({
    name: kekPath,
    plaintext: plaintextDek,
  })
  if (!encryptResponse.ciphertext) {
    throw new Error('KMS encrypt operation did not return ciphertext for DEK.')
  }
  return { plaintextDek, encryptedDek: encryptResponse.ciphertext }
}

/**
 * Decrypts a KEK-wrapped Data Encryption Key (DEK).
 * @param encryptedDek The encrypted DEK.
 * @param kekPath The name of the KEK used to wrap the DEK.
 * @returns The plaintext DEK.
 */
async function decryptDataKey(
  encryptedDek: Buffer | string | Uint8Array,
  kekPath: string,
): Promise<Buffer | string | Uint8Array> {
  const [decryptResponse] = await kmsClient.decrypt({
    name: kekPath,
    ciphertext: encryptedDek,
  })
  if (!decryptResponse.plaintext) {
    throw new Error('KMS decrypt operation did not return plaintext for DEK.')
  }
  return decryptResponse.plaintext
}

// --- Data Encryption and Decryption (using AES-256-GCM) ---

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

/**
 * Encrypts data using a plaintext DEK and AES-256-GCM.
 */
function encryptData(
  plaintext: string,
  plaintextDek: Buffer | string | Uint8Array,
): EncryptedField {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, plaintextDek, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/**
 * Decrypts data using a plaintext DEK and AES-256-GCM.
 */
function decryptData(
  encryptedData: EncryptedField,
  plaintextDek: Buffer | string | Uint8Array,
): string {
  if (
    !encryptedData ||
    typeof encryptedData !== 'object' ||
    !encryptedData.ciphertext ||
    !encryptedData.iv ||
    !encryptedData.authTag
  ) {
    throw new Error(
      'Invalid encryptedData format: Expected an object with ciphertext, iv, and authTag as base64 strings.',
    )
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    plaintextDek,
    Buffer.from(encryptedData.iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'))

  let decrypted = decipher.update(encryptedData.ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * High-privacy mode: DEK/KEK envelope encryption backed by Cloud KMS.
 */
export const kmsEnvelopeProvider: CryptoProvider = {
  scheme: 'kms-envelope:v1',
  generateDataKey,
  decryptDataKey,
  encryptData,
  decryptData,
}

export { kmsClient }
