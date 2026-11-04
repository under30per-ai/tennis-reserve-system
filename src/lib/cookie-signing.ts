import { createHmac, timingSafeEqual } from 'node:crypto';

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error('COOKIE_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Signs a value with HMAC-SHA256 to prevent tampering.
 * Format: base64url(value).base64url(signature)
 */
export function signValue(value: string): string {
  const secret = getSecret();
  const signature = createHmac('sha256', secret)
    .update(value)
    .digest('base64url');
  return `${Buffer.from(value).toString('base64url')}.${signature}`;
}

/**
 * Verifies and extracts the original value from a signed string.
 * Returns null if the signature is invalid.
 */
export function verifySignedValue(signed: string): string | null {
  const secret = getSecret();
  const dotIndex = signed.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const encodedValue = signed.slice(0, dotIndex);
  const providedSig = signed.slice(dotIndex + 1);

  let value: string;
  try {
    value = Buffer.from(encodedValue, 'base64url').toString();
  } catch {
    return null;
  }

  const expectedSig = createHmac('sha256', secret)
    .update(value)
    .digest('base64url');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(providedSig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  return value;
}
