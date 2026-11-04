/**
 * Generates a scrypt hash for a given password.
 * Usage: npx tsx scripts/generate-password-hash.ts <password>
 *
 * The output can be set as ADMIN_PASSWORD_HASH in .env.local
 */
import { scrypt, randomBytes } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npx tsx scripts/generate-password-hash.ts <password>');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
scrypt(password, salt, 64, (err, derivedKey) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  const hash = `${salt}:${derivedKey.toString('hex')}`;
  console.log(hash);
});
