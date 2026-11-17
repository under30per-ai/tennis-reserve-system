import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { memberRow, emailVerificationRow } from './helpers/fixtures';
import { createChainMock } from './helpers/mock-db';

// ── Mocks ─────────────────────────────────────────────

const mockCookieStore = createMockCookieStore();
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn().mockImplementation((fn: Function) => fn),
}));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
};
vi.mock('@/db', () => ({ db: mockDb }));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
  checkAdminWriteLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/audit-log', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(undefined),
  sendTrialConfirmation: vi.fn().mockResolvedValue(undefined),
  sendTrialStatusUpdate: vi.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ────────────────────────────────

const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  searchMembers,
  registerMember,
  verifyEmail,
  resendVerificationCode,
  updateOwnProfile,
  getMembersByLevel,
} = await import('@/app/actions/members');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── getMembers ────────────────────────────────────────

describe('getMembers', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getMembers()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns member list for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([memberRow()]));
    const result = await getMembers();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('田中太郎');
  });

  it('returns empty array when no members', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getMembers();
    expect(result).toHaveLength(0);
  });
});

// ── getMemberById ─────────────────────────────────────

describe('getMemberById', () => {
  it('throws when not authenticated', async () => {
    await expect(getMemberById('m1')).rejects.toThrow('認証が必要です');
  });

  it('throws when member accesses other member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getMemberById('m2')).rejects.toThrow('権限がありません');
  });

  it('returns own member data', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([memberRow()]));
    const result = await getMemberById('m1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('m1');
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getMemberById('m-none');
    expect(result).toBeNull();
  });

  it('admin can access any member', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([memberRow({ id: 'm2' })]));
    const result = await getMemberById('m2');
    expect(result).not.toBeNull();
  });
});

// ── createMember ──────────────────────────────────────

describe('createMember', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(
      createMember({
        name: 'Test', nameKana: 'テスト', email: 'test@test.com', phone: '',
        level: 'beginner', membershipType: 'regular', joinDate: '2024-01-01',
        isActive: true, notes: '', remainingTransfers: 3, password: 'pass1234',
      })
    ).rejects.toThrow('管理者権限が必要です');
  });

  it('creates member for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([memberRow({ id: 'm-new' })]));
    const result = await createMember({
      name: 'New', nameKana: 'ニュー', email: 'new@test.com', phone: '',
      level: 'beginner', membershipType: 'regular', joinDate: '2024-01-01',
      isActive: true, notes: '', remainingTransfers: 3, password: 'pass1234',
    });
    expect(result.id).toBe('m-new');
  });
});

// ── updateMember ──────────────────────────────────────

describe('updateMember', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateMember('m1', { name: 'Updated' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates member for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([memberRow({ name: 'Updated' })]));
    const result = await updateMember('m1', { name: 'Updated' });
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated');
  });

  it('returns null when member not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    const result = await updateMember('m-none', { name: 'X' });
    expect(result).toBeNull();
  });
});

// ── deleteMember ──────────────────────────────────────

describe('deleteMember', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteMember('m1')).rejects.toThrow('管理者権限が必要です');
  });

  it('deletes member chat messages and member', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.delete.mockReturnValue(createChainMock([]));
    await deleteMember('m1');
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });
});

// ── searchMembers ─────────────────────────────────────

describe('searchMembers', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(searchMembers('田中')).rejects.toThrow('管理者権限が必要です');
  });

  it('returns matching members', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([memberRow()]));
    const result = await searchMembers('田中');
    expect(result).toHaveLength(1);
  });

  it('returns empty for no match', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await searchMembers('存在しない');
    expect(result).toHaveLength(0);
  });
});

// ── registerMember ────────────────────────────────────

describe('registerMember', () => {
  it('returns error for empty name', async () => {
    const result = await registerMember({
      name: '', nameKana: 'テスト', email: 'test@test.com', phone: '090-1234-5678', password: 'Password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('氏名');
  });

  it('returns error for empty nameKana', async () => {
    const result = await registerMember({
      name: 'Test', nameKana: '', email: 'test@test.com', phone: '090-1234-5678', password: 'Password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('フリガナ');
  });

  it('returns error for invalid email', async () => {
    const result = await registerMember({
      name: 'Test', nameKana: 'テスト', email: 'bademail', phone: '090-1234-5678', password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('returns error for invalid phone', async () => {
    const result = await registerMember({
      name: 'Test', nameKana: 'テスト', email: 'test@test.com', phone: 'abc', password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('returns error for weak password', async () => {
    const result = await registerMember({
      name: 'Test', nameKana: 'テスト', email: 'test@test.com', phone: '090-1234-5678', password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('returns success silently for existing email (prevents enumeration)', async () => {
    mockDb.select.mockReturnValue(createChainMock([memberRow()]));
    const result = await registerMember({
      name: 'Test', nameKana: 'テスト', email: 'tanaka@test.com', phone: '090-1234-5678', password: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('creates verification record for new email', async () => {
    mockDb.select.mockReturnValue(createChainMock([])); // no existing member
    mockDb.transaction.mockImplementation(async (fn: Function) => {
      const tx = {
        delete: vi.fn().mockReturnValue(createChainMock([])),
        insert: vi.fn().mockReturnValue(createChainMock([])),
      };
      return fn(tx);
    });
    const result = await registerMember({
      name: 'New', nameKana: 'ニュー', email: 'new@test.com', phone: '090-0000-0000', password: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('returns error when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterMs: 300000 });
    const result = await registerMember({
      name: 'Test', nameKana: 'テスト', email: 'test@test.com', phone: '090-1234-5678', password: 'Password1',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('上限');
  });
});

// ── verifyEmail ───────────────────────────────────────

describe('verifyEmail', () => {
  it('returns error when verification not found', async () => {
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await verifyEmail({ email: 'x@test.com', code: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('認証コード');
  });

  it('returns error when too many attempts', async () => {
    const ev = emailVerificationRow({ attempts: 5 });
    mockDb.select.mockReturnValue(createChainMock([ev]));
    mockDb.delete.mockReturnValue(createChainMock([]));
    const result = await verifyEmail({ email: 'new@test.com', code: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('上限');
  });

  it('returns error when code expired', async () => {
    const ev = emailVerificationRow({ expiresAt: new Date('2020-01-01T00:00:00Z') });
    mockDb.select.mockReturnValue(createChainMock([ev]));
    const result = await verifyEmail({ email: 'new@test.com', code: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('有効期限');
  });

  it('returns error for wrong code', async () => {
    const ev = emailVerificationRow({ code: '654321' });
    mockDb.select.mockReturnValue(createChainMock([ev]));
    mockDb.update.mockReturnValue(createChainMock([]));
    const result = await verifyEmail({ email: 'new@test.com', code: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('認証コード');
  });

  it('succeeds with correct code', async () => {
    const ev = emailVerificationRow({ code: '123456' });
    let selectCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCount++;
      if (selectCount === 1) return createChainMock([ev]); // verification lookup
      return createChainMock([]); // no existing member
    });
    mockDb.update.mockReturnValue(createChainMock([]));
    mockDb.insert.mockReturnValue(createChainMock([memberRow({ id: 'm-new', email: 'new@test.com' })]));
    mockDb.delete.mockReturnValue(createChainMock([]));

    const result = await verifyEmail({ email: 'new@test.com', code: '123456' });
    expect(result.success).toBe(true);
  });
});

// ── resendVerificationCode ────────────────────────────

describe('resendVerificationCode', () => {
  it('returns error when no pending verification', async () => {
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await resendVerificationCode('x@test.com');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('仮登録');
  });

  it('succeeds when pending verification exists', async () => {
    const ev = emailVerificationRow();
    mockDb.select.mockReturnValue(createChainMock([ev]));
    mockDb.update.mockReturnValue(createChainMock([]));
    const result = await resendVerificationCode('new@test.com');
    expect(result.success).toBe(true);
  });

  it('returns error when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterMs: 300000 });
    const result = await resendVerificationCode('x@test.com');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('上限');
  });
});

// ── updateOwnProfile ──────────────────────────────────

describe('updateOwnProfile', () => {
  it('throws when not authenticated', async () => {
    await expect(updateOwnProfile({ name: 'X' })).rejects.toThrow('認証が必要です');
  });

  it('throws when admin tries to use it', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    await expect(updateOwnProfile({ name: 'X' })).rejects.toThrow('会員のみ使用可能です');
  });

  it('updates own profile for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.update.mockReturnValue(createChainMock([memberRow({ name: 'Updated' })]));
    const result = await updateOwnProfile({ name: 'Updated' });
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated');
  });
});

// ── getMembersByLevel ─────────────────────────────────

describe('getMembersByLevel', () => {
  it('throws when not authenticated', async () => {
    await expect(getMembersByLevel('beginner')).rejects.toThrow('認証が必要です');
  });

  it('returns members of given level', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([
      memberRow({ isActive: true }),
    ]));
    const result = await getMembersByLevel('intermediate');
    expect(result).toHaveLength(1);
  });
});
