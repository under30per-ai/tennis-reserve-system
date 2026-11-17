import { vi } from 'vitest';
import { signValue } from '@/lib/cookie-signing';
import type { AuthUser } from '@/domain/models';

/**
 * In-memory cookie store for testing.
 */
export function createMockCookieStore() {
  const store = new Map<string, { value: string }>();
  return {
    get: vi.fn((name: string) => store.get(name) ?? undefined),
    set: vi.fn((name: string, value: string) => {
      store.set(name, { value });
    }),
    delete: vi.fn((name: string) => {
      store.delete(name);
    }),
    _store: store,
  };
}

/**
 * Builds a signed cookie value that getAuthUser() will accept.
 */
export function buildAuthCookieValue(user: AuthUser): string {
  const data = {
    user,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h from now
  };
  return signValue(JSON.stringify(data));
}

/**
 * Sets up the mock cookie store with an authenticated user.
 */
export function setAuthenticatedUser(
  cookieStore: ReturnType<typeof createMockCookieStore>,
  user: AuthUser
) {
  const signedValue = buildAuthCookieValue(user);
  cookieStore._store.set('tennis_auth', { value: signedValue });
}

// Commonly used test users
export const ADMIN_USER: AuthUser = {
  id: 'admin',
  name: '管理者',
  role: 'admin',
};

export const MEMBER_USER: AuthUser = {
  id: 'm1',
  name: '田中太郎',
  role: 'member',
  memberId: 'm1',
};
