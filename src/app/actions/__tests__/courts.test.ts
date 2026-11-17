import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCookieStore, setAuthenticatedUser, ADMIN_USER, MEMBER_USER } from './helpers/mock-auth';
import { courtRow } from './helpers/fixtures';
import { createChainMock } from './helpers/mock-db';

const mockCookieStore = createMockCookieStore();
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue(mockCookieStore) }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), unstable_cache: vi.fn().mockImplementation((fn: Function) => fn) }));
const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
vi.mock('@/db', () => ({ db: mockDb }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }), checkAdminWriteLimit: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/audit-log', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }));

const { getCourts, getCourtById, createCourt, updateCourt, deleteCourt } = await import('@/app/actions/courts');

beforeEach(() => { mockCookieStore._store.clear(); vi.clearAllMocks(); });

describe('getCourts', () => {
  it('throws when not authenticated', async () => { await expect(getCourts()).rejects.toThrow('認証が必要です'); });
  it('returns courts for authenticated user', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([courtRow()]));
    expect(await getCourts()).toHaveLength(1);
  });
});

describe('getCourtById', () => {
  it('throws when not authenticated', async () => { await expect(getCourtById('ct1')).rejects.toThrow('認証が必要です'); });
  it('returns court when found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([courtRow()]));
    const r = await getCourtById('ct1');
    expect(r).not.toBeNull();
    expect(r!.name).toBe('コートA');
  });
  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getCourtById('ct-none')).toBeNull();
  });
});

describe('createCourt', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createCourt({ name: 'X', type: 'indoor', surface: 'hard', capacity: 4, isActive: true })).rejects.toThrow('管理者権限が必要です');
  });
  it('creates court for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([courtRow({ id: 'ct-new' })]));
    const result = await createCourt({ name: 'New', type: 'outdoor', surface: 'clay', capacity: 2, isActive: true });
    expect(result.id).toBe('ct-new');
  });
});

describe('updateCourt', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateCourt('ct1', { name: 'X' })).rejects.toThrow('管理者権限が必要です');
  });
  it('updates court for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([courtRow({ name: 'Updated' })]));
    const result = await updateCourt('ct1', { name: 'Updated' });
    expect(result).not.toBeNull();
  });
  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateCourt('ct-none', { name: 'X' })).toBeNull();
  });
});

describe('deleteCourt', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteCourt('ct1')).rejects.toThrow('管理者権限が必要です');
  });
  it('deletes court for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.delete.mockReturnValue(createChainMock([]));
    await deleteCourt('ct1');
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
