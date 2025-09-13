"use server";

import { auth } from '@/firebase/server/config'; // Firebase Admin SDK auth

export async function getEncryptionKey(idToken: string): Promise<{ key?: string; error?: string }> {
  try {
    if (!idToken) {
      return { error: 'Unauthorized: No ID token provided' };
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return { error: 'Unauthorized: Invalid ID token' };
    }

    // Optional: Add admin role check here if needed, using decodedToken.uid or custom claims
    // For example, if you have a custom claim 'admin: true'
    // if (!decodedToken.admin) {
    //   return { error: 'Forbidden: Not an admin' };
    // }

    const encryptionKey = process.env.ENCRYPTION_SECRET_KEY;

    if (!encryptionKey) {
      console.error('ENCRYPTION_SECRET_KEY is not set in environment variables.');
      return { error: 'Server Error: Encryption key not configured' };
    }

    return { key: encryptionKey };

  } catch (error) {
    console.error('Unexpected error in getEncryptionKey Server Action:', error);
    return { error: 'Internal Server Error' };
  }
}
