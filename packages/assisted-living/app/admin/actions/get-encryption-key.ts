'use server'

export async function getEncryptionKey(): Promise<{
  key?: string
  error?: string
}> {
  try {
    const encryptionKey = process.env.ENCRYPTION_SECRET_KEY

    if (!encryptionKey) {
      console.error(
        'ENCRYPTION_SECRET_KEY is not set in environment variables.',
      )
      throw new Error('Encryption key not configured')
    }

    return { key: encryptionKey }
  } catch (error) {
    console.error('Unexpected error in getEncryptionKey Server Action:', error)
    return { error: 'Internal Server Error: ' + error }
  }
}
