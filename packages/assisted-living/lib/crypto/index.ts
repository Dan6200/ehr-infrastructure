import { kmsEnvelopeProvider } from './kms-envelope-provider'
import type { CryptoProvider } from './types'

export type {
  CryptoProvider,
  CryptoScheme,
  DataKey,
  EncryptedField,
} from './types'

let activeProvider: CryptoProvider | undefined

/**
 * Resolves the active crypto provider from `CRYPTO_MODE`.
 *
 * Fails closed: an unknown or not-yet-implemented mode throws rather than
 * silently falling back to another scheme. `plaintext` mode is intentionally not
 * wired yet — it requires the distinct storage codec described in #7, so we must
 * not pretend it is supported.
 */
export function getCryptoProvider(): CryptoProvider {
  if (activeProvider) return activeProvider

  const mode = process.env.CRYPTO_MODE ?? 'kms-envelope'
  switch (mode) {
    case 'kms-envelope':
      activeProvider = kmsEnvelopeProvider
      break
    default:
      throw new Error(
        `Unsupported CRYPTO_MODE "${mode}". Expected "kms-envelope".`,
      )
  }

  return activeProvider
}

/** Test seam: install a provider without going through `CRYPTO_MODE`. */
export function setCryptoProviderForTesting(provider: CryptoProvider): void {
  activeProvider = provider
}

/** Test seam: clear the cached provider. */
export function resetCryptoProviderForTesting(): void {
  activeProvider = undefined
}
