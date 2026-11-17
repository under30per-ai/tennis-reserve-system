import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { lessonRecordRow } from './helpers/fixtures';
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

vi.mock('@/lib/audit-log', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ────────────────────────────────

const {
  getLessonRecords,
  createLessonRecord,
  updateLessonRecord,
  getLessonRecordByInstanceId,
  getMemberLessonHistory,
} = await import('@/app/actions/lesson-records');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('getLessonRecords', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getLessonRecords()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns records for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonRecordRow()]));
    expect(await getLessonRecords()).toHaveLength(1);
  });

  it('returns empty array', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getLessonRecords()).toHaveLength(0);
  });
});

describe('createLessonRecord', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createLessonRecord({
      lessonInstanceId: 'li1', theme: 'Test', content: 'Test', memberNotes: [],
    })).rejects.toThrow('管理者権限が必要です');
  });

  it('throws when record already exists', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonRecordRow()]));
    await expect(createLessonRecord({
      lessonInstanceId: 'li1', theme: 'Test', content: 'Test', memberNotes: [],
    })).rejects.toThrow('既に存在します');
  });

  it('creates record for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([])); // no existing
    mockDb.insert.mockReturnValue(createChainMock([lessonRecordRow()]));
    const result = await createLessonRecord({
      lessonInstanceId: 'li1', theme: 'Forehand', content: 'Practice', memberNotes: [],
    });
    expect(result.theme).toBe('フォアハンド');
  });
});

describe('updateLessonRecord', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateLessonRecord('lr1', { theme: 'Updated' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates record', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([lessonRecordRow({ theme: 'Updated' })]));
    const result = await updateLessonRecord('lr1', { theme: 'Updated' });
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateLessonRecord('lr-none', { theme: 'X' })).toBeNull();
  });
});

describe('getLessonRecordByInstanceId', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getLessonRecordByInstanceId('li1')).rejects.toThrow('管理者権限が必要です');
  });

  it('returns record when found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([lessonRecordRow()]));
    const r = await getLessonRecordByInstanceId('li1');
    expect(r).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getLessonRecordByInstanceId('li-none')).toBeNull();
  });
});

describe('getMemberLessonHistory', () => {
  it('throws when not authenticated', async () => {
    await expect(getMemberLessonHistory('m1')).rejects.toThrow('認証が必要です');
  });

  it('throws when member accesses other member history', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getMemberLessonHistory('m2')).rejects.toThrow('権限がありません');
  });

  it('returns own history', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const r = await getMemberLessonHistory('m1');
    expect(r).toEqual([]);
  });

  it('admin can view any member history', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const r = await getMemberLessonHistory('m2');
    expect(r).toEqual([]);
  });
});
