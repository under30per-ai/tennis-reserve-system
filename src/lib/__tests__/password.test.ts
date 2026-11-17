import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isHashedPassword } from '@/lib/password';

describe('hashPassword', () => {
  it('returns salt:hash format', async () => {
    const hash = await hashPassword('test1234');
    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const h1 = await hashPassword('password');
    const h2 = await hashPassword('password');
    expect(h1).not.toBe(h2);
  });
});

describe('verifyPassword', () => {
  it('verifies correct password', async () => {
    const hash = await hashPassword('myPassword1');
    expect(await verifyPassword('myPassword1', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('myPassword1');
    expect(await verifyPassword('wrongPassword', hash)).toBe(false);
  });

  it('returns false for invalid hash format', async () => {
    expect(await verifyPassword('test', 'nocolon')).toBe(false);
  });
});

describe('isHashedPassword', () => {
  it('returns true for valid hashed password', async () => {
    const hash = await hashPassword('test1234');
    expect(isHashedPassword(hash)).toBe(true);
  });

  it('returns false for plaintext', () => {
    expect(isHashedPassword('plaintext')).toBe(false);
  });

  it('returns false for wrong salt length', () => {
    expect(isHashedPassword('abc:def')).toBe(false);
  });

  it('returns false for non-hex characters', () => {
    const salt = 'g'.repeat(32);
    const key = '0'.repeat(128);
    expect(isHashedPassword(`${salt}:${key}`)).toBe(false);
  });
});
