import { describe, it, expect } from 'vitest';
import { signValue, verifySignedValue } from '@/lib/cookie-signing';

describe('signValue / verifySignedValue', () => {
  it('round-trips a simple string', () => {
    const signed = signValue('hello');
    const result = verifySignedValue(signed);
    expect(result).toBe('hello');
  });

  it('round-trips a JSON payload', () => {
    const payload = JSON.stringify({ user: 'admin', role: 'admin' });
    const signed = signValue(payload);
    const result = verifySignedValue(signed);
    expect(result).toBe(payload);
    expect(JSON.parse(result!)).toEqual({ user: 'admin', role: 'admin' });
  });

  it('detects tampered value', () => {
    const signed = signValue('original');
    // Replace the encoded value portion (before the last dot)
    const tampered = Buffer.from('tampered').toString('base64url') + signed.slice(signed.lastIndexOf('.'));
    expect(verifySignedValue(tampered)).toBeNull();
  });

  it('detects tampered signature', () => {
    const signed = signValue('hello');
    const tampered = signed.slice(0, -1) + 'X';
    expect(verifySignedValue(tampered)).toBeNull();
  });

  it('returns null for string without dot', () => {
    expect(verifySignedValue('nodot')).toBeNull();
  });

  it('returns null for empty encoded value', () => {
    expect(verifySignedValue('.fakesig')).toBeNull();
  });

  it('handles unicode values', () => {
    const signed = signValue('こんにちは世界');
    expect(verifySignedValue(signed)).toBe('こんにちは世界');
  });
});
