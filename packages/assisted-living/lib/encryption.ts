'use server'
import { KeyManagementServiceClient } from '@google-cloud/kms'
import * as crypto from 'crypto'
import { execSync } from 'child_process'

// Helper function to get config value from env or gcloud fallback
function getKmsConfig(envVarName: string, gcloudCommand: string): string {
  if (process.env[envVarName]) {
    return process.env[envVarName]!
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const value = execSync(gcloudCommand).toString().trim()
      if (value) {
        console.warn(`KMS config: Fetched ${envVarName} from gcloud: ${value}`)
        return value
      }
    } catch (e: any) {
      console.warn(
        `KMS config: Failed to fetch ${envVarName} from gcloud: ${e.message}`,
      )
    }
  }

  throw new Error(
    `KMS config: Environment variable ${envVarName} is not set and could not be fetched from gcloud.`,
  )
}

// Configuration for KMS
const KMS_PROJECT_ID = getKmsConfig(
  'GCP_PROJECT_ID',
  'gcloud config get-value project',
)
const KMS_LOCATION = getKmsConfig('KMS_LOCATION', 'echo europe-west1')
const KMS_KEY_RING = getKmsConfig(
  'KMS_KEY_RING',
  `gcloud kms keyrings list --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name=assisted-living" --format="value(name)"`,
)

export const KEK_GENERAL_PATH = getKmsConfig(
  'KEK_GENERAL_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name=kek-general" --format="value(name)"`,
)
export const KEK_CONTACT_PATH = getKmsConfig(
  'KEK_CONTACT_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name=kek-contact" --format="value(name)"`,
)
export const KEK_CLINICAL_PATH = getKmsConfig(
  'KEK_CLINICAL_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name=kek-clinical" --format="value(name)"`,
)

const kmsClient = new KeyManagementServiceClient()

// --- DEK Generation and Wrapping/Unwrapping ---

/**
 * Generates a new Data Encryption Key (DEK) and encrypts it with the specified KEK.
 * @param kekPath The name of the KEK to use for wrapping the DEK.
 * @returns A tuple containing the plaintext DEK (as Buffer) and the encrypted DEK (as Buffer).
 */
export async function generateDataKey(kekPath: string): Promise<{
  plaintextDek: Buffer
  encryptedDek: Buffer | string | Uint8Array
}> {
  // Generate a new 256-bit (32-byte) AES key
  const plaintextDek = crypto.randomBytes(32)

  // Encrypt the DEK with KMS
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
 * Decrypts an encrypted Data Encryption Key (DEK) using the specified KEK.
 * @param encryptedDek The encrypted DEK (as Buffer).
 * @param kekPath The name of the KEK used to wrap the DEK.
 * @returns The plaintext DEK (as Buffer).
 */
export async function decryptDataKey(
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
const IV_LENGTH = 16 // For AES-256-GCM

/**
 * Encrypts data using a plaintext DEK and AES-256-GCM.
 * @param plaintext The data to encrypt (as string).
 * @param plaintextDek The plaintext DEK (as Buffer).
 * @returns An object containing the encrypted data (ciphertext), IV, and authentication tag.
 */
export function encryptData(
  plaintext: string,
  plaintextDek: Buffer | string | Uint8Array,
): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, plaintextDek, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return {
    ciphertext: Buffer.from(encrypted, 'base64'),
    iv,
    authTag,
  }
}

/**
 * Decrypts data using a plaintext DEK and AES-256-GCM.
 * @param encryptedData An object containing the ciphertext, IV, and authentication tag.
 * @param plaintextDek The plaintext DEK (as Buffer).
 * @returns The decrypted data (as string).
 */
export function decryptData(
  encryptedData: { ciphertext: Buffer; iv: Buffer; authTag: Buffer },
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
      'Invalid encryptedData format: Expected an object with ciphertext, iv, and authTag.',
    )
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    plaintextDek,
    encryptedData.iv,
  )
  decipher.setAuthTag(encryptedData.authTag)

  let decrypted = decipher.update(
    encryptedData.ciphertext.toString('base64'),
    'base64',
    'utf8',
  )
  decrypted += decipher.final('utf8')

  return decrypted
}

// Export the KMS client for direct use if needed (e.g., for testing)
export { kmsClient }
