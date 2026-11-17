import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { lessonInstanceRow, reservationRow, lessonSlotRow, coachRow, courtRow } from './helpers/fixtures';
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
};
vi.mock('@/db', () => ({ db: mockDb }));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
  checkAdminWriteLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/app/actions/notification-helper', () => ({
  createNotificationInternal: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/audit-log', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ────────────────────────────────

const {
  cancelLessonInstance,
  generateLessonInstances,
  getLessonInstances,
  getLessonInstanceById,
  updateLessonInstance,
  getLessonInstancesByDate,
  getLessonInstancesByDateRange,
  getLessonInstanceWithDetails,
  getInstancesWithDetailsForDate,
  getInstancesWithDetailsForDateRange,
} = await import('@/app/actions/lesson-instances');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('cancelLessonInstance', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(cancelLessonInstance('li1', '雨天中止')).rejects.toThrow(
      '管理者権限が必要です'
    );
  });

  it('cancels instance and notifies affected members', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const inst = lessonInstanceRow();
    const res = reservationRow({ memberId: 'm1', status: 'confirmed' });

    mockDb.update.mockReturnValue(createChainMock([]));

    let selectCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCount++;
      if (selectCount === 1) return createChainMock([inst]); // instance lookup
      return createChainMock([res]); // reservations for notification
    });

    await cancelLessonInstance('li1', '雨天中止');
    expect(mockDb.update).toHaveBeenCalled();

    const { createNotificationInternal } = await import(
      '@/app/actions/notification-helper'
    );
    expect(createNotificationInternal).toHaveBeenCalledWith(
      'm1',
      'lesson_cancel',
      expect.any(String),
      expect.stringContaining('雨天中止'),
      'li1'
    );
  });
});

describe('generateLessonInstances', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const slot = {
      id: 'ls1',
      title: 'Test',
      level: 'beginner' as const,
      coachId: 'c1',
      courtId: 'ct1',
      dayOfWeek: 1 as const,
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      isRecurring: true,
      recurrenceType: 'weekly' as const,
      recurrenceStartDate: '2024-01-01',
      recurrenceEndDate: null,
      specificDate: null,
      monthlyWeekNumber: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    await expect(
      generateLessonInstances(slot, new Date('2024-01-01'), new Date('2024-01-31'))
    ).rejects.toThrow('管理者権限が必要です');
  });

  it('generates and inserts instances for active slot', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const slot = {
      id: 'ls1',
      title: 'Test',
      level: 'beginner' as const,
      coachId: 'c1',
      courtId: 'ct1',
      dayOfWeek: 1 as const,
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      isRecurring: true,
      recurrenceType: 'weekly' as const,
      recurrenceStartDate: '2024-01-01',
      recurrenceEndDate: null,
      specificDate: null,
      monthlyWeekNumber: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // 5 Mondays in Jan 2024 → should return 5 instances
    const fakeRows = Array.from({ length: 5 }, (_, i) =>
      lessonInstanceRow({ id: `li-${i}`, date: `2024-01-0${(i + 1) * 7 > 31 ? 29 : (i + 1) * 7}` })
    );
    mockDb.insert.mockReturnValue(createChainMock(fakeRows));

    const result = await generateLessonInstances(
      slot,
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );
    expect(result).toHaveLength(5);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('returns empty array for slot with no matching days', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const slot = {
      id: 'ls1',
      title: 'Test',
      level: 'beginner' as const,
      coachId: 'c1',
      courtId: 'ct1',
      dayOfWeek: 0 as const, // Sunday
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      isRecurring: true,
      recurrenceType: 'none' as const,
      recurrenceStartDate: '2024-01-01',
      recurrenceEndDate: null,
      specificDate: null, // no specificDate
      monthlyWeekNumber: null,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const result = await generateLessonInstances(
      slot,
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );
    expect(result).toHaveLength(0);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

// ── getLessonInstances ─────────────────────────────────

describe('getLessonInstances', () => {
  it('throws when not authenticated', async () => {
    await expect(getLessonInstances()).rejects.toThrow('認証が必要です');
  });

  it('returns instances for authenticated user', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonInstanceRow()]));
    const result = await getLessonInstances();
    expect(result).toHaveLength(1);
  });
});

// ── getLessonInstanceById ──────────────────────────────

describe('getLessonInstanceById', () => {
  it('throws when not authenticated', async () => {
    await expect(getLessonInstanceById('li1')).rejects.toThrow('認証が必要です');
  });

  it('returns instance when found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonInstanceRow()]));
    const result = await getLessonInstanceById('li1');
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getLessonInstanceById('li-none')).toBeNull();
  });
});

// ── updateLessonInstance ──────────────────────────────

describe('updateLessonInstance', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateLessonInstance('li1', { startTime: '11:00' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates instance for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([lessonInstanceRow({ startTime: '11:00' })]));
    const result = await updateLessonInstance('li1', { startTime: '11:00' });
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateLessonInstance('li-none', { startTime: '11:00' })).toBeNull();
  });
});

// ── getLessonInstancesByDate ───────────────────────────

describe('getLessonInstancesByDate', () => {
  it('throws when not authenticated', async () => {
    await expect(getLessonInstancesByDate('2024-12-15')).rejects.toThrow('認証が必要です');
  });

  it('returns instances for given date', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonInstanceRow()]));
    const result = await getLessonInstancesByDate('2024-12-15');
    expect(result).toHaveLength(1);
  });
});

// ── getLessonInstancesByDateRange ──────────────────────

describe('getLessonInstancesByDateRange', () => {
  it('throws when not authenticated', async () => {
    await expect(getLessonInstancesByDateRange('2024-01-01', '2024-01-31')).rejects.toThrow('認証が必要です');
  });

  it('returns instances in date range', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonInstanceRow()]));
    const result = await getLessonInstancesByDateRange('2024-01-01', '2024-12-31');
    expect(result).toHaveLength(1);
  });

  it('throws for invalid date format', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getLessonInstancesByDateRange('bad', '2024-01-31')).rejects.toThrow('日付');
  });
});

// ── getLessonInstanceWithDetails ───────────────────────

describe('getLessonInstanceWithDetails', () => {
  it('throws when not authenticated', async () => {
    await expect(getLessonInstanceWithDetails('li1')).rejects.toThrow('認証が必要です');
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getLessonInstanceWithDetails('li-none')).toBeNull();
  });

  it('returns instance with details', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const joinedRow = {
      lesson_instances: lessonInstanceRow(),
      lesson_slots: lessonSlotRow(),
      coaches: coachRow(),
      courts: courtRow(),
    };
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([joinedRow]); // instance join
      return createChainMock([]); // reservations
    });
    const result = await getLessonInstanceWithDetails('li1');
    expect(result).not.toBeNull();
  });
});

// ── getInstancesWithDetailsForDate ────────────────────

describe('getInstancesWithDetailsForDate', () => {
  it('throws when not authenticated', async () => {
    await expect(getInstancesWithDetailsForDate('2024-12-15')).rejects.toThrow('認証が必要です');
  });

  it('returns instances with details for date', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getInstancesWithDetailsForDate('2024-12-15');
    expect(result).toEqual([]);
  });
});

// ── getInstancesWithDetailsForDateRange ───────────────

describe('getInstancesWithDetailsForDateRange', () => {
  it('throws when not authenticated', async () => {
    await expect(getInstancesWithDetailsForDateRange('2024-01-01', '2024-01-31')).rejects.toThrow('認証が必要です');
  });

  it('returns instances with details for date range', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getInstancesWithDetailsForDateRange('2024-01-01', '2024-12-31');
    expect(result).toEqual([]);
  });
});
