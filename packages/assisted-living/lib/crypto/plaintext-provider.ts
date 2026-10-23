import type { CryptoProvider } from './types'

/**
 * Regular EHR mode.
 *
 * This provider deliberately does NOT emulate encryption. The storage codec for
 * a plaintext tenant writes a structurally distinct document (no `encrypted_*`
 * fields, no wrapped DEK), so the envelope pipeline must never run here. Any
 * attempt to use the crypto operations throws — fail closed rather than silently
 * storing plaintext in an envelope-shaped document.
 */
export const plaintextProvider: CryptoProvider = {
  scheme: 'none:v1',
  async generateDataKey() {
    throw new Error('Plaintext mode does not generate data keys.')
  },
  async decryptDataKey() {
    throw new Error('Plaintext mode does not decrypt data keys.')
  },
  encryptData() {
    throw new Error('Plaintext mode does not encrypt data.')
  },
  decryptData() {
    throw new Error('Plaintext mode does not decrypt data.')
  },
}
