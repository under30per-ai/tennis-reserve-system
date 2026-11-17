import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCookieStore, setAuthenticatedUser, ADMIN_USER, MEMBER_USER } from './helpers/mock-auth';
import { coachRow } from './helpers/fixtures';
import { createChainMock } from './helpers/mock-db';

const mockCookieStore = createMockCookieStore();
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue(mockCookieStore) }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), unstable_cache: vi.fn().mockImplementation((fn: Function) => fn) }));
const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
vi.mock('@/db', () => ({ db: mockDb }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }), checkAdminWriteLimit: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/audit-log', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }));

const { getCoaches, getCoachById, createCoach, updateCoach, deleteCoach } = await import('@/app/actions/coaches');

beforeEach(() => { mockCookieStore._store.clear(); vi.clearAllMocks(); });

describe('getCoaches', () => {
  it('throws when not authenticated', async () => { await expect(getCoaches()).rejects.toThrow('認証が必要です'); });
  it('returns coaches for authenticated user', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([coachRow()]));
    const result = await getCoaches();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('佐藤コーチ');
  });
  it('returns empty array', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getCoaches()).toHaveLength(0);
  });
});

describe('getCoachById', () => {
  it('throws when not authenticated', async () => { await expect(getCoachById('c1')).rejects.toThrow('認証が必要です'); });
  it('returns coach when found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([coachRow()]));
    const result = await getCoachById('c1');
    expect(result).not.toBeNull();
  });
  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getCoachById('c-none')).toBeNull();
  });
});

describe('createCoach', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createCoach({ name: 'X', nameKana: 'X', email: 'x@test.com', phone: '', specialties: ['beginner'], bio: '', certifications: [], isActive: true })).rejects.toThrow('管理者権限が必要です');
  });
  it('creates coach for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([coachRow({ id: 'c-new' })]));
    const result = await createCoach({ name: 'New', nameKana: 'ニュー', email: 'new@test.com', phone: '', specialties: ['beginner'], bio: '', certifications: [], isActive: true });
    expect(result.id).toBe('c-new');
  });
});

describe('updateCoach', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateCoach('c1', { name: 'Updated' })).rejects.toThrow('管理者権限が必要です');
  });
  it('updates coach for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([coachRow({ name: 'Updated' })]));
    const result = await updateCoach('c1', { name: 'Updated' });
    expect(result).not.toBeNull();
  });
  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateCoach('c-none', { name: 'X' })).toBeNull();
  });
});

describe('deleteCoach', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteCoach('c1')).rejects.toThrow('管理者権限が必要です');
  });
  it('deletes coach for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.delete.mockReturnValue(createChainMock([]));
    await deleteCoach('c1');
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
