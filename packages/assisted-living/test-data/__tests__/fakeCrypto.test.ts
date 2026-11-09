import { fakeCryptoProvider } from '../fakeCrypto'

describe('fakeCryptoProvider rotation semantics', () => {
  it('issues a distinct DEK per data key', async () => {
    const a = await fakeCryptoProvider.generateDataKey('kek')
    const b = await fakeCryptoProvider.generateDataKey('kek')
    expect(a.plaintextDek.equals(b.plaintextDek)).toBe(false)
  })

  it('recovers the matching DEK from its own wrapped value', async () => {
    const { plaintextDek, encryptedDek } =
      await fakeCryptoProvider.generateDataKey('kek')
    const recovered = await fakeCryptoProvider.decryptDataKey(
      encryptedDek,
      'kek',
    )
    expect(Buffer.from(recovered as Uint8Array).equals(plaintextDek)).toBe(true)
  })

  it('cannot decrypt ciphertext with a different DEK (rotation breaks old data)', async () => {
    const a = await fakeCryptoProvider.generateDataKey('kek')
    const b = await fakeCryptoProvider.generateDataKey('kek')
    const field = fakeCryptoProvider.encryptData('secret', a.plaintextDek)

    expect(() =>
      fakeCryptoProvider.decryptData(field, b.plaintextDek),
    ).toThrow()
  })
})
