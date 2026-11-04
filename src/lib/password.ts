import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SALT_LEN = 16;

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(SALT_LEN).toString('hex');
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    if (!salt || !key) {
      resolve(false);
      return;
    }
    scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      try {
        resolve(timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Checks if a stored password is already hashed (salt:hash format).
 * Used for gradual migration from plaintext to hashed passwords.
 */
export function isHashedPassword(stored: string): boolean {
  if (!stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  // Hashed format: 32-char hex salt + ":" + 128-char hex key
  return salt.length === SALT_LEN * 2 && key.length === SCRYPT_KEYLEN * 2 && /^[0-9a-f]+$/.test(salt) && /^[0-9a-f]+$/.test(key);
}
