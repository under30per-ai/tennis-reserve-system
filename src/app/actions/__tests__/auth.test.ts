import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
  buildAuthCookieValue,
} from './helpers/mock-auth';
import { memberRow } from './helpers/fixtures';
import { createChainMock } from './helpers/mock-db';

// ── Mocks ─────────────────────────────────────────────

const mockCookieStore = createMockCookieStore();
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
vi.mock('@/db', () => ({ db: mockDb }));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

// ── Import after mocks ────────────────────────────────

const { login, logout, getAuthUser, requireAuth, requireAdmin } = await import(
  '@/app/actions/auth'
);

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('getAuthUser', () => {
  it('returns null when no cookie exists', async () => {
    const user = await getAuthUser();
    expect(user).toBeNull();
  });

  it('returns user from valid signed cookie', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const user = await getAuthUser();
    expect(user).toEqual(MEMBER_USER);
  });

  it('returns null and deletes cookie on tampered value', async () => {
    mockCookieStore._store.set('tennis_auth', { value: 'tampered.value' });
    const user = await getAuthUser();
    expect(user).toBeNull();
    expect(mockCookieStore.delete).toHaveBeenCalledWith('tennis_auth');
  });

  it('returns null for expired cookie', async () => {
    const data = {
      user: MEMBER_USER,
      expiresAt: Date.now() - 1000, // expired
    };
    const { signValue } = await import('@/lib/cookie-signing');
    const signed = signValue(JSON.stringify(data));
    mockCookieStore._store.set('tennis_auth', { value: signed });

    const user = await getAuthUser();
    expect(user).toBeNull();
  });
});

describe('requireAuth', () => {
  it('returns user when authenticated', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const user = await requireAuth();
    expect(user).toEqual(MEMBER_USER);
  });

  it('throws when not authenticated', async () => {
    await expect(requireAuth()).rejects.toThrow('認証が必要です');
  });
});

describe('requireAdmin', () => {
  it('returns user when admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const user = await requireAdmin();
    expect(user).toEqual(ADMIN_USER);
  });

  it('throws when member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(requireAdmin()).rejects.toThrow('管理者権限が必要です');
  });

  it('throws when not authenticated', async () => {
    await expect(requireAdmin()).rejects.toThrow('認証が必要です');
  });
});

describe('login', () => {
  it('returns null for wrong admin email', async () => {
    const result = await login('wrong@test.com', 'pass', 'admin');
    expect(result).toBeNull();
  });

  it('returns null for wrong admin password', async () => {
    // ADMIN_EMAIL is set in vitest.setup.ts
    // ADMIN_PASSWORD_HASH is 'dummy-hash' which won't match any password
    const result = await login('admin@test.example.com', 'wrongpass', 'admin');
    expect(result).toBeNull();
  });

  it('returns null when member email not found in DB', async () => {
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await login('nobody@test.com', 'password', 'member');
    expect(result).toBeNull();
  });

  it('returns null for wrong member password', async () => {
    const row = memberRow({ password: 'invalid:format' });
    mockDb.select.mockReturnValue(createChainMock([row]));
    const result = await login('tanaka@test.com', 'wrongpass', 'member');
    expect(result).toBeNull();
  });

  it('returns member user and sets cookie on success', async () => {
    const { hashPassword } = await import('@/lib/password');
    const hashed = await hashPassword('correctPassword1');
    const row = memberRow({ password: hashed });
    mockDb.select.mockReturnValue(createChainMock([row]));

    const result = await login('tanaka@test.com', 'correctPassword1', 'member');
    expect(result).not.toBeNull();
    expect(result!.role).toBe('member');
    expect(result!.memberId).toBe('m1');
    // Cookie should have been set
    expect(mockCookieStore.set).toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('deletes the auth cookie', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await logout();
    expect(mockCookieStore.delete).toHaveBeenCalledWith('tennis_auth');
  });
});
