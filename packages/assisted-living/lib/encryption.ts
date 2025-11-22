import { KeyManagementServiceClient } from '@google-cloud/kms'
import * as crypto from 'crypto'
import { execSync } from 'child_process'

// Helper function to get config value from env or gcloud fallback
function getKmsConfig(envVarName: string, gcloudCommand: string): string {
  // In a deployed Google Cloud environment (Functions, Run), variables are set.
  if (process.env.K_SERVICE || process.env.FUNCTION_TARGET) {
    console.log('runs')
    if (process.env[envVarName]) {
      return process.env[envVarName]!
    }
    throw new Error(
      `KMS config: In a Google Cloud environment, but the environment variable ${envVarName} is not set.`,
    )
  }

  // For local development, try env var first, then gcloud fallback.
  if (process.env[envVarName]) {
    return process.env[envVarName]!
  }

  try {
    const value = execSync(gcloudCommand).toString().trim()
    if (value) {
      console.warn(`KMS config: Fetched ${envVarName} from gcloud: ${value}`)
      return value
    }
  } catch (e: any) {
    // This is expected to fail in environments without gcloud, like the functions build server.
    // We will fall through to the final error.
  }

  throw new Error(
    `KMS config: Environment variable ${envVarName} is not set and could not be fetched via gcloud fallback.`,
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
  `gcloud kms keyrings list --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name:assisted-living" --format="value(name)"`,
)

export const KEK_GENERAL_PATH = getKmsConfig(
  'KEK_GENERAL_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name:kek-general" --format="value(name)"`,
)
export const KEK_CONTACT_PATH = getKmsConfig(
  'KEK_CONTACT_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name:kek-contact" --format="value(name)"`,
)
export const KEK_CLINICAL_PATH = getKmsConfig(
  'KEK_CLINICAL_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name:kek-clinical" --format="value(name)"`,
)
export const KEK_FINANCIAL_PATH = getKmsConfig(
  'KEK_FINANCIAL_PATH',
  `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name:kek-financial" --format="value(name)"`,
)

// export const KEK_RESPONDER_PATH = getKmsConfig(
//   'KEK_RESPONDER_PATH',
//   `gcloud kms keys list --keyring=${KMS_KEY_RING} --location=${KMS_LOCATION} --project=${KMS_PROJECT_ID} --filter="name:kek-responder" --format="value(name)"`,
// )

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
const IV_LENGTH = 16

/**
 * Encrypts data using a plaintext DEK and AES-256-GCM.
 * @param plaintext The data to encrypt (as string).
 * @param plaintextDek The plaintext DEK (as Buffer).
 * @returns An object containing the encrypted data (ciphertext), IV, and authentication tag.
 */
export function encryptData(
  plaintext: string,
  plaintextDek: Buffer | string | Uint8Array,
): { ciphertext: string; iv: string; authTag: string } {
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
 * @param encryptedData An object containing the ciphertext, IV, and authentication tag.
 * @param plaintextDek The plaintext DEK (as Buffer).
 * @returns The decrypted data (as string).
 */
export function decryptData(
  encryptedData: { ciphertext: string; iv: string; authTag: string },
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

export { kmsClient }
