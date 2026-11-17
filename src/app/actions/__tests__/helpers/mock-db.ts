import { vi } from 'vitest';

/**
 * Creates a chainable mock that simulates Drizzle ORM query builder.
 * Each method returns the same chain so you can call .from().where().limit() etc.
 * Call `mockResolvedValue` on the chain to set the eventual resolved value.
 */
export function createChainMock(resolvedValue: unknown = []) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler: ProxyHandler<Record<string, ReturnType<typeof vi.fn>>> = {
    get(_target, prop: string) {
      if (prop === 'then') {
        // Make the chain thenable so await resolves to the value
        return (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(new Proxy({}, handler));
      }
      return chain[prop];
    },
  };
  return new Proxy({}, handler);
}

/**
 * Creates a mock `db` object with select/insert/update/delete.
 * Each accepts a resolved value via the factory parameter.
 */
export function createMockDb(overrides: {
  selectValue?: unknown;
  insertValue?: unknown;
  updateValue?: unknown;
  deleteValue?: unknown;
} = {}) {
  return {
    select: vi.fn().mockReturnValue(createChainMock(overrides.selectValue ?? [])),
    insert: vi.fn().mockReturnValue(createChainMock(overrides.insertValue ?? [])),
    update: vi.fn().mockReturnValue(createChainMock(overrides.updateValue ?? [])),
    delete: vi.fn().mockReturnValue(createChainMock(overrides.deleteValue ?? [])),
    transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      // For transaction, provide a minimal tx mock with the same chainable API
      const tx = {
        select: vi.fn().mockReturnValue(createChainMock(overrides.selectValue ?? [])),
        insert: vi.fn().mockReturnValue(createChainMock(overrides.insertValue ?? [])),
        update: vi.fn().mockReturnValue(createChainMock(overrides.updateValue ?? [])),
        delete: vi.fn().mockReturnValue(createChainMock(overrides.deleteValue ?? [])),
      };
      return fn(tx);
    }),
  };
}

// Shared mock db instance — tests override return values per test via mockDb helpers
let _mockDb = createMockDb();

export function getMockDb() {
  return _mockDb;
}

export function resetMockDb(overrides: Parameters<typeof createMockDb>[0] = {}) {
  _mockDb = createMockDb(overrides);
  return _mockDb;
}

/**
 * Helper to make db.select().from()....where() return a specific value.
 * Returns a chainable proxy that resolves to `rows`.
 */
export function mockSelectReturning(rows: unknown[]) {
  return createChainMock(rows);
}

export function mockInsertReturning(rows: unknown[]) {
  return createChainMock(rows);
}

export function mockUpdateReturning(rows: unknown[]) {
  return createChainMock(rows);
}
