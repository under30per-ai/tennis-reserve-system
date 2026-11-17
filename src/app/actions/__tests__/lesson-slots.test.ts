import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCookieStore, setAuthenticatedUser, ADMIN_USER, MEMBER_USER } from './helpers/mock-auth';
import { lessonSlotRow } from './helpers/fixtures';
import { createChainMock } from './helpers/mock-db';

const mockCookieStore = createMockCookieStore();
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue(mockCookieStore) }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), unstable_cache: vi.fn().mockImplementation((fn: Function) => fn) }));
const mockDb = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
vi.mock('@/db', () => ({ db: mockDb }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }), checkAdminWriteLimit: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/audit-log', () => ({ writeAuditLog: vi.fn().mockResolvedValue(undefined) }));

const { getLessonSlots, getLessonSlotById, createLessonSlot, updateLessonSlot, deleteLessonSlot } = await import('@/app/actions/lesson-slots');

beforeEach(() => { mockCookieStore._store.clear(); vi.clearAllMocks(); });

describe('getLessonSlots', () => {
  it('throws when not authenticated', async () => { await expect(getLessonSlots()).rejects.toThrow('認証が必要です'); });
  it('returns slots for authenticated user', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonSlotRow()]));
    expect(await getLessonSlots()).toHaveLength(1);
  });
});

describe('getLessonSlotById', () => {
  it('throws when not authenticated', async () => { await expect(getLessonSlotById('ls1')).rejects.toThrow('認証が必要です'); });
  it('returns slot when found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonSlotRow()]));
    const r = await getLessonSlotById('ls1');
    expect(r).not.toBeNull();
  });
  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getLessonSlotById('ls-none')).toBeNull();
  });
});

describe('createLessonSlot', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createLessonSlot({
      title: 'X', level: 'beginner', coachId: 'c1', courtId: 'ct1', dayOfWeek: 1,
      startTime: '10:00', endTime: '11:00', maxCapacity: 8, isRecurring: true,
      recurrenceType: 'weekly', recurrenceStartDate: '2024-01-01', recurrenceEndDate: null,
      specificDate: null, monthlyWeekNumber: null, isActive: true,
    })).rejects.toThrow('管理者権限が必要です');
  });
  it('creates slot for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([lessonSlotRow({ id: 'ls-new' })]));
    const result = await createLessonSlot({
      title: 'New', level: 'beginner', coachId: 'c1', courtId: 'ct1', dayOfWeek: 2,
      startTime: '14:00', endTime: '15:00', maxCapacity: 6, isRecurring: true,
      recurrenceType: 'weekly', recurrenceStartDate: '2024-01-01', recurrenceEndDate: null,
      specificDate: null, monthlyWeekNumber: null, isActive: true,
    });
    expect(result.id).toBe('ls-new');
  });
});

describe('updateLessonSlot', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateLessonSlot('ls1', { title: 'X' })).rejects.toThrow('管理者権限が必要です');
  });
  it('updates slot for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([lessonSlotRow({ title: 'Updated' })]));
    const result = await updateLessonSlot('ls1', { title: 'Updated' });
    expect(result).not.toBeNull();
  });
  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateLessonSlot('ls-none', { title: 'X' })).toBeNull();
  });
});

describe('deleteLessonSlot', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteLessonSlot('ls1')).rejects.toThrow('管理者権限が必要です');
  });
  it('deletes slot for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.delete.mockReturnValue(createChainMock([]));
    await deleteLessonSlot('ls1');
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
