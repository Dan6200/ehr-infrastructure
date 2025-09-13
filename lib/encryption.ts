import CryptoJS from 'crypto-js';

const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 16;   // 128 bits
const KEY_SIZE = 256 / 32; // AES-256 key size in words

/**
 * Derives a key from a secret using PBKDF2.
 * @param secret The secret (e.g., user's password).
 * @param salt The salt to use for key derivation.
 * @returns The derived key.
 */
function deriveKey(secret: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE,
    iterations: 10000, // Number of iterations, higher is more secure but slower
  });
}

/**
 * Encrypts a string using AES-256-CBC.
 * The output format is "salt.iv.encryptedData".
 * @param text The text to encrypt.
 * @param secret The secret (e.g., user's password) to derive the key.
 * @returns The encrypted string in "salt.iv.encryptedData" format.
 */
export function encrypt(text: string, secret: string): string {
  if (!text || !secret) {
    return text; // Or throw an error, depending on desired behavior
  }

  const salt = CryptoJS.lib.WordArray.random(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = CryptoJS.lib.WordArray.random(IV_LENGTH);

  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Return salt, IV, and encrypted data as a single string, separated by dots
  return `${salt.toString(CryptoJS.enc.Hex)}.${iv.toString(CryptoJS.enc.Hex)}.${encrypted.toString()}`;
}

/**
 * Decrypts a string using AES-256-CBC.
 * The input format is "salt.iv.encryptedData".
 * @param encryptedText The encrypted string in "salt.iv.encryptedData" format.
 * @param secret The secret (e.g., user's password) to derive the key.
 * @returns The decrypted string.
 */
export function decrypt(encryptedText: string, secret: string): string {
  if (!encryptedText || !secret) {
    return encryptedText; // Or throw an error
  }

  const parts = encryptedText.split('.');
  if (parts.length !== 3) {
    // Not an encrypted string in our expected format, return as is or throw error
    return encryptedText;
  }

  const salt = CryptoJS.enc.Hex.parse(parts[0]);
  const iv = CryptoJS.enc.Hex.parse(parts[1]);
  const cipherText = parts[2];

  const key = deriveKey(secret, salt);

  const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
