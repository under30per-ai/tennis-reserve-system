import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCookieStore, setAuthenticatedUser, ADMIN_USER, MEMBER_USER } from './helpers/mock-auth';
import { notificationRow } from './helpers/fixtures';
import { createChainMock } from './helpers/mock-db';

const mockCookieStore = createMockCookieStore();
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue(mockCookieStore) }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), unstable_cache: vi.fn().mockImplementation((fn: Function) => fn) }));
const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
vi.mock('@/db', () => ({ db: mockDb }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }) }));

const { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } = await import('@/app/actions/notifications');

beforeEach(() => { mockCookieStore._store.clear(); vi.clearAllMocks(); });

describe('getMyNotifications', () => {
  it('throws when not authenticated', async () => { await expect(getMyNotifications()).rejects.toThrow('認証が必要です'); });
  it('returns empty for admin (no memberId)', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    expect(await getMyNotifications()).toEqual([]);
  });
  it('returns notifications for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([notificationRow()]));
    const result = await getMyNotifications();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('テスト通知');
  });
  it('returns empty when no notifications', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getMyNotifications()).toHaveLength(0);
  });
});

describe('getUnreadCount', () => {
  it('throws when not authenticated', async () => { await expect(getUnreadCount()).rejects.toThrow('認証が必要です'); });
  it('returns 0 for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    expect(await getUnreadCount()).toBe(0);
  });
  it('returns count for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([{ value: 3 }]));
    expect(await getUnreadCount()).toBe(3);
  });
});

describe('markAsRead', () => {
  it('throws when not authenticated', async () => { await expect(markAsRead('n1')).rejects.toThrow('認証が必要です'); });
  it('does nothing when notification not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await markAsRead('n-none');
    expect(mockDb.update).not.toHaveBeenCalled();
  });
  it('throws when member marks other member notification', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([notificationRow({ memberId: 'other' })]));
    await expect(markAsRead('n1')).rejects.toThrow('権限がありません');
  });
  it('marks own notification as read', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([notificationRow({ memberId: 'm1' })]));
    mockDb.update.mockReturnValue(createChainMock([]));
    await markAsRead('n1');
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe('markAllAsRead', () => {
  it('throws when not authenticated', async () => { await expect(markAllAsRead()).rejects.toThrow('認証が必要です'); });
  it('does nothing for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    await markAllAsRead();
    expect(mockDb.update).not.toHaveBeenCalled();
  });
  it('marks all as read for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    await markAllAsRead();
    expect(mockDb.update).toHaveBeenCalled();
  });
});
