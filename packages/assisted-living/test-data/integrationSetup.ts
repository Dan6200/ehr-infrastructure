import { setCryptoProviderForTesting } from '#root/lib/crypto'
import { fakeCryptoProvider } from './fakeCrypto'

process.env.NEXT_PUBLIC_FB_PROJECT_ID =
  process.env.NEXT_PUBLIC_FB_PROJECT_ID ?? 'demo-test'
process.env.NEXT_PUBLIC_DATABASE_ID =
  process.env.NEXT_PUBLIC_DATABASE_ID ?? 'staging-beta'
process.env.KEK_GENERAL_PATH ??= 'test/kek/general'
process.env.KEK_CONTACT_PATH ??= 'test/kek/contact'
process.env.KEK_CLINICAL_PATH ??= 'test/kek/clinical'
process.env.KEK_FINANCIAL_PATH ??= 'test/kek/financial'

// Avoid real Cloud KMS in the emulator run.
setCryptoProviderForTesting(fakeCryptoProvider)
