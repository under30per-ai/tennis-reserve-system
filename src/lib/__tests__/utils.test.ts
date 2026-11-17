import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateObj,
  formatTime,
  formatDateTime,
  toISODateString,
  getInitials,
  cn,
  getAvailabilityLabel,
} from '@/lib/utils';

describe('formatDate', () => {
  it('formats ISO date string with default format', () => {
    expect(formatDate('2024-03-15')).toBe('2024/03/15');
  });

  it('accepts custom format', () => {
    expect(formatDate('2024-03-15', 'M月d日')).toBe('3月15日');
  });
});

describe('formatDateObj', () => {
  it('formats Date object with default format', () => {
    expect(formatDateObj(new Date(2024, 2, 15))).toBe('2024/03/15');
  });
});

describe('formatTime', () => {
  it('returns input as-is', () => {
    expect(formatTime('09:30')).toBe('09:30');
  });
});

describe('formatDateTime', () => {
  it('formats ISO datetime string', () => {
    const result = formatDateTime('2024-03-15T14:30:00');
    expect(result).toBe('2024/03/15 14:30');
  });
});

describe('toISODateString', () => {
  it('converts Date to yyyy-MM-dd', () => {
    expect(toISODateString(new Date(2024, 0, 5))).toBe('2024-01-05');
  });
});

describe('getInitials', () => {
  it('returns first chars of two-part name', () => {
    expect(getInitials('田中 太郎')).toBe('田太');
  });

  it('returns first two chars for single-part name', () => {
    expect(getInitials('太郎')).toBe('太郎');
  });

  it('handles single character name', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('handles multi-space name', () => {
    expect(getInitials('John  Doe')).toBe('JD');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns empty string for all falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});

describe('getAvailabilityLabel', () => {
  it('returns 満員 when available is 0', () => {
    const result = getAvailabilityLabel(0, 10);
    expect(result.label).toBe('満員');
    expect(result.color).toContain('red');
  });

  it('returns 残りN名 when available <= 20% of max', () => {
    const result = getAvailabilityLabel(2, 10);
    expect(result.label).toBe('残り2名');
    expect(result.color).toContain('orange');
  });

  it('returns 空きあり when available > 20% of max', () => {
    const result = getAvailabilityLabel(5, 10);
    expect(result.label).toBe('空きあり (5/10)');
    expect(result.color).toContain('green');
  });

  it('returns 満員 when available is negative', () => {
    const result = getAvailabilityLabel(-1, 10);
    expect(result.label).toBe('満員');
  });
});
