import {
  getCryptoProvider,
  resetCryptoProviderForTesting,
  setCryptoProviderForTesting,
} from '../index'
import type { CryptoProvider } from '../types'

const fakeProvider: CryptoProvider = {
  scheme: 'kms-envelope:v1',
  generateDataKey: async () => ({
    plaintextDek: Buffer.alloc(0),
    encryptedDek: '',
  }),
  decryptDataKey: async () => Buffer.alloc(0),
  encryptData: () => ({ ciphertext: '', iv: '', authTag: '' }),
  decryptData: () => '',
}

describe('crypto provider factory', () => {
  afterEach(() => {
    resetCryptoProviderForTesting()
    delete process.env.CRYPTO_MODE
  })

  it('defaults to the KMS envelope provider', () => {
    expect(getCryptoProvider().scheme).toBe('kms-envelope:v1')
  })

  it('fails closed on an unsupported CRYPTO_MODE', () => {
    process.env.CRYPTO_MODE = 'plaintext'
    expect(() => getCryptoProvider()).toThrow(/Unsupported CRYPTO_MODE/)
  })

  it('supports a test override', () => {
    setCryptoProviderForTesting(fakeProvider)
    expect(getCryptoProvider()).toBe(fakeProvider)
  })
})
