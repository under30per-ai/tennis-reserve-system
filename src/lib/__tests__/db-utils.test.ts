import { describe, it, expect } from 'vitest';
import { buildPartialUpdate } from '@/lib/db-utils';

describe('buildPartialUpdate', () => {
  it('picks only defined keys', () => {
    const result = buildPartialUpdate(
      { name: 'Test', email: 'test@test.com', phone: undefined },
      ['name', 'email', 'phone']
    );
    expect(result).toEqual({ name: 'Test', email: 'test@test.com' });
  });

  it('applies defaults', () => {
    const result = buildPartialUpdate(
      { name: 'Updated' },
      ['name'],
      { updatedAt: 'now' }
    );
    expect(result).toEqual({ name: 'Updated', updatedAt: 'now' });
  });

  it('returns only defaults when no matching keys', () => {
    const result = buildPartialUpdate(
      { other: 'value' } as Record<string, unknown>,
      ['name', 'email'],
      { updatedAt: 'now' }
    );
    expect(result).toEqual({ updatedAt: 'now' });
  });

  it('returns empty object when no matches and no defaults', () => {
    const result = buildPartialUpdate({}, ['name']);
    expect(result).toEqual({});
  });

  it('overrides defaults with data values', () => {
    const result = buildPartialUpdate(
      { name: 'Override' },
      ['name'],
      { name: 'Default' }
    );
    expect(result).toEqual({ name: 'Override' });
  });
});
