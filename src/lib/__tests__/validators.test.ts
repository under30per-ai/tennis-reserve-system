import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateRequired,
  validatePhone,
  validateTime,
  validateTimeRange,
  validateCapacity,
  validateDateString,
  validatePassword,
} from '@/lib/validators';

describe('validateEmail', () => {
  it('returns error for empty string', () => {
    expect(validateEmail('')).not.toBeNull();
  });

  it('returns error for missing @', () => {
    expect(validateEmail('invalidemail')).not.toBeNull();
  });

  it('returns error for missing domain', () => {
    expect(validateEmail('user@')).not.toBeNull();
  });

  it('returns null for valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns null for email with subdomain', () => {
    expect(validateEmail('user@sub.example.co.jp')).toBeNull();
  });
});

describe('validateRequired', () => {
  it('returns error for empty string', () => {
    expect(validateRequired('', '名前')).toBe('名前を入力してください');
  });

  it('returns error for whitespace-only string', () => {
    expect(validateRequired('   ', '名前')).toBe('名前を入力してください');
  });

  it('returns null for non-empty string', () => {
    expect(validateRequired('田中', '名前')).toBeNull();
  });
});

describe('validatePhone', () => {
  it('returns null for empty string (optional)', () => {
    expect(validatePhone('')).toBeNull();
  });

  it('returns error for letters', () => {
    expect(validatePhone('abc-1234')).not.toBeNull();
  });

  it('returns error for too few digits', () => {
    expect(validatePhone('123456')).not.toBeNull();
  });

  it('returns null for valid phone with hyphens', () => {
    expect(validatePhone('090-1234-5678')).toBeNull();
  });

  it('returns null for valid phone without hyphens', () => {
    expect(validatePhone('09012345678')).toBeNull();
  });
});

describe('validateTime', () => {
  it('returns error for empty string', () => {
    expect(validateTime('')).not.toBeNull();
  });

  it('returns error for invalid format', () => {
    expect(validateTime('9:00')).not.toBeNull();
  });

  it('returns error for out-of-range hour', () => {
    expect(validateTime('25:00')).not.toBeNull();
  });

  it('returns null for valid time', () => {
    expect(validateTime('09:30')).toBeNull();
  });

  it('returns null for 23:59', () => {
    expect(validateTime('23:59')).toBeNull();
  });
});

describe('validateTimeRange', () => {
  it('returns null when both are empty', () => {
    expect(validateTimeRange('', '')).toBeNull();
  });

  it('returns error when start >= end', () => {
    expect(validateTimeRange('10:00', '09:00')).not.toBeNull();
  });

  it('returns error when start == end', () => {
    expect(validateTimeRange('10:00', '10:00')).not.toBeNull();
  });

  it('returns null for valid range', () => {
    expect(validateTimeRange('09:00', '10:30')).toBeNull();
  });
});

describe('validateCapacity', () => {
  it('returns error for 0', () => {
    expect(validateCapacity(0)).not.toBeNull();
  });

  it('returns error for negative', () => {
    expect(validateCapacity(-1)).not.toBeNull();
  });

  it('returns error for >100', () => {
    expect(validateCapacity(101)).not.toBeNull();
  });

  it('returns null for 1', () => {
    expect(validateCapacity(1)).toBeNull();
  });

  it('returns null for 100', () => {
    expect(validateCapacity(100)).toBeNull();
  });
});

describe('validateDateString', () => {
  it('returns error for empty string', () => {
    expect(validateDateString('')).not.toBeNull();
  });

  it('returns error for wrong format', () => {
    expect(validateDateString('2024/01/01')).not.toBeNull();
  });

  it('returns null for valid date string', () => {
    expect(validateDateString('2024-01-15')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('returns error for empty string', () => {
    expect(validatePassword('')).not.toBeNull();
  });

  it('returns error for < 8 chars', () => {
    expect(validatePassword('abc123')).not.toBeNull();
  });

  it('returns error for no letters', () => {
    expect(validatePassword('12345678')).not.toBeNull();
  });

  it('returns error for no digits', () => {
    expect(validatePassword('abcdefgh')).not.toBeNull();
  });

  it('returns null for valid password', () => {
    expect(validatePassword('Password1')).toBeNull();
  });

  it('returns null for mixed case + digits', () => {
    expect(validatePassword('securePass99')).toBeNull();
  });
});
