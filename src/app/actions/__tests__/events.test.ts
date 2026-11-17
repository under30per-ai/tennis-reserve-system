import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { eventRow, eventRegistrationRow, memberRow } from './helpers/fixtures';
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

vi.mock('@/app/actions/notification-helper', () => ({
  createNotificationInternal: vi.fn().mockResolvedValue({}),
}));

// ── Import after mocks ────────────────────────────────

const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  getMyEventRegistrations,
} = await import('@/app/actions/events');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('getEvents', () => {
  it('throws when not authenticated', async () => {
    await expect(getEvents()).rejects.toThrow('認証が必要です');
  });

  it('returns events', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([eventRow()]));
    expect(await getEvents()).toHaveLength(1);
  });
});

describe('getEventById', () => {
  it('throws when not authenticated', async () => {
    await expect(getEventById('e1')).rejects.toThrow('認証が必要です');
  });

  it('returns event', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([eventRow()]));
    const r = await getEventById('e1');
    expect(r).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getEventById('e-none')).toBeNull();
  });
});

describe('createEvent', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createEvent({
      title: 'X', description: '', eventDate: '2099-01-01',
      startTime: '09:00', endTime: '17:00', maxParticipants: 10,
      fee: 0, isPublished: false,
    })).rejects.toThrow('管理者権限が必要です');
  });

  it('creates event for admin (unpublished)', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([eventRow({ isPublished: false })]));
    const result = await createEvent({
      title: 'New', description: '', eventDate: '2099-01-01',
      startTime: '09:00', endTime: '17:00', maxParticipants: 10,
      fee: 0, isPublished: false,
    });
    expect(result.title).toBe('テニス大会');
  });

  it('notifies members when published', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([eventRow({ isPublished: true })]));
    mockDb.select.mockReturnValue(createChainMock([memberRow()]));
    await createEvent({
      title: 'Public', description: '', eventDate: '2099-01-01',
      startTime: '09:00', endTime: '17:00', maxParticipants: 10,
      fee: 0, isPublished: true,
    });
    const { createNotificationInternal } = await import('@/app/actions/notification-helper');
    expect(createNotificationInternal).toHaveBeenCalled();
  });
});

describe('updateEvent', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateEvent('e1', { title: 'X' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates event', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([eventRow({ title: 'Updated' })]));
    const r = await updateEvent('e1', { title: 'Updated' });
    expect(r).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateEvent('e-none', { title: 'X' })).toBeNull();
  });
});

describe('deleteEvent', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteEvent('e1')).rejects.toThrow('管理者権限が必要です');
  });

  it('deletes event and registrations', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.delete.mockReturnValue(createChainMock([]));
    await deleteEvent('e1');
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });
});

describe('registerForEvent', () => {
  it('throws when not authenticated', async () => {
    await expect(registerForEvent('e1')).rejects.toThrow('認証が必要です');
  });

  it('throws when event not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(registerForEvent('e-none')).rejects.toThrow('イベントが見つかりません');
  });

  it('throws when event not published', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      return createChainMock(c === 1 ? [eventRow({ isPublished: false })] : []);
    });
    await expect(registerForEvent('e1')).rejects.toThrow('公開されていません');
  });

  it('throws when already registered', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([eventRow()]);
      return createChainMock([eventRegistrationRow()]);
    });
    await expect(registerForEvent('e1')).rejects.toThrow('既に申込済みです');
  });

  it('registers with confirmed status when capacity available', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([eventRow({ maxParticipants: 10 })]);
      if (c === 2) return createChainMock([]); // not registered yet
      return createChainMock([]); // current registrations count
    });
    mockDb.insert.mockReturnValue(createChainMock([eventRegistrationRow({ status: 'registered' })]));
    const r = await registerForEvent('e1');
    expect(r.status).toBe('registered');
  });

  it('registers as waitlisted when at capacity', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const existing = Array.from({ length: 32 }, (_, i) =>
      eventRegistrationRow({ id: `er${i}`, memberId: `m${i + 10}` })
    );
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([eventRow({ maxParticipants: 32 })]);
      if (c === 2) return createChainMock([]); // not registered yet
      return createChainMock(existing); // at capacity
    });
    mockDb.insert.mockReturnValue(createChainMock([eventRegistrationRow({ status: 'waitlisted' })]));
    const r = await registerForEvent('e1');
    expect(r.status).toBe('waitlisted');
  });
});

describe('cancelEventRegistration', () => {
  it('throws when not authenticated', async () => {
    await expect(cancelEventRegistration('er1')).rejects.toThrow('認証が必要です');
  });

  it('does nothing when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await cancelEventRegistration('er-none');
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('throws when member cancels other member reg', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([eventRegistrationRow({ memberId: 'other' })]));
    await expect(cancelEventRegistration('er1')).rejects.toThrow('権限がありません');
  });

  it('cancels own registration', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([eventRegistrationRow({ memberId: 'm1', status: 'waitlisted' })]);
      return createChainMock([]);
    });
    mockDb.update.mockReturnValue(createChainMock([]));
    await cancelEventRegistration('er1');
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('admin can cancel any registration', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([eventRegistrationRow({ memberId: 'other', status: 'waitlisted' })]);
      return createChainMock([]);
    });
    mockDb.update.mockReturnValue(createChainMock([]));
    await cancelEventRegistration('er1');
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe('getMyEventRegistrations', () => {
  it('throws when not authenticated', async () => {
    await expect(getMyEventRegistrations()).rejects.toThrow('認証が必要です');
  });

  it('returns empty for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    expect(await getMyEventRegistrations()).toEqual([]);
  });

  it('returns registrations for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([eventRegistrationRow()]));
    const r = await getMyEventRegistrations();
    expect(r).toHaveLength(1);
  });
});
