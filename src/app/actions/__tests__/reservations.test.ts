import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { lessonInstanceRow, reservationRow, memberRow, lessonSlotRow, coachRow, courtRow } from './helpers/fixtures';
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
  makeReservation,
  cancelReservation,
  transferReservation,
  getReservations,
  getMemberReservations,
  getReservationsForInstance,
  getAllReservationsWithDetails,
} = await import('@/app/actions/reservations');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('makeReservation', () => {
  it('throws when not authenticated', async () => {
    await expect(makeReservation('m1', 'li1')).rejects.toThrow('認証が必要です');
  });

  it('throws when member tries to book for another member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(makeReservation('other-member', 'li1')).rejects.toThrow('権限がありません');
  });

  it('throws when lesson instance not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(makeReservation('m1', 'li-not-found')).rejects.toThrow(
      'レッスンが見つかりません'
    );
  });

  it('throws when lesson is cancelled', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const row = lessonInstanceRow({ isCancelled: true });
    mockDb.select.mockReturnValue(createChainMock([row]));
    await expect(makeReservation('m1', 'li1')).rejects.toThrow('中止されています');
  });

  it('throws when lesson is in the past', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const row = lessonInstanceRow({ date: '2020-01-01' });
    mockDb.select.mockReturnValue(createChainMock([row]));
    await expect(makeReservation('m1', 'li1')).rejects.toThrow('過去のレッスン');
  });

  it('throws when already reserved', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const instRow = lessonInstanceRow({ date: '2099-12-31' });
    const resRow = reservationRow({ memberId: 'm1', status: 'confirmed' });

    // First call: lesson instance lookup; Second call: existing reservations
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([instRow]);
      return createChainMock([resRow]);
    });

    await expect(makeReservation('m1', 'li1')).rejects.toThrow('既に予約済みです');
  });

  it('creates confirmed reservation when capacity available', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const instRow = lessonInstanceRow({ date: '2099-12-31', maxCapacity: 8 });
    const newResRow = reservationRow({ status: 'confirmed' });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([instRow]);
      return createChainMock([]); // no existing reservations
    });
    mockDb.insert.mockReturnValue(createChainMock([newResRow]));

    const result = await makeReservation('m1', 'li1');
    expect(result.status).toBe('confirmed');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('creates waitlisted reservation when at capacity', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const instRow = lessonInstanceRow({ date: '2099-12-31', maxCapacity: 1 });
    const existingRes = reservationRow({
      id: 'r-other',
      memberId: 'other',
      status: 'confirmed',
    });
    const newResRow = reservationRow({ status: 'waitlisted', waitlistPosition: 1 });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([instRow]);
      return createChainMock([existingRes]);
    });
    mockDb.insert.mockReturnValue(createChainMock([newResRow]));

    const result = await makeReservation('m1', 'li1');
    expect(result.status).toBe('waitlisted');
  });

  it('allows admin to book for any member', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const instRow = lessonInstanceRow({ date: '2099-12-31' });
    const newResRow = reservationRow({ memberId: 'any-member', status: 'confirmed' });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([instRow]);
      return createChainMock([]);
    });
    mockDb.insert.mockReturnValue(createChainMock([newResRow]));

    const result = await makeReservation('any-member', 'li1');
    expect(result.status).toBe('confirmed');
  });
});

describe('cancelReservation', () => {
  it('throws when not authenticated', async () => {
    await expect(cancelReservation('r1')).rejects.toThrow('認証が必要です');
  });

  it('throws when member tries to cancel another members reservation', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const row = reservationRow({ memberId: 'other-member' });
    mockDb.select.mockReturnValue(createChainMock([row]));
    await expect(cancelReservation('r1')).rejects.toThrow('権限がありません');
  });

  it('cancels reservation and promotes waitlisted member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const row = reservationRow({
      memberId: 'm1',
      status: 'confirmed',
      lessonInstanceId: 'li1',
    });
    const waitlistedRow = reservationRow({
      id: 'r-wait',
      memberId: 'm2',
      status: 'waitlisted',
      waitlistPosition: 1,
    });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([row]); // find reservation
      return createChainMock([waitlistedRow]); // find waitlisted
    });
    mockDb.update.mockReturnValue(createChainMock([]));

    await cancelReservation('r1');
    // update should be called: 1 for cancel, 1 for promote
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it('does nothing when reservation not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await cancelReservation('r-nonexistent');
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('allows admin to cancel any reservation', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const row = reservationRow({ memberId: 'other-member', status: 'cancelled' });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([row]);
      return createChainMock([]); // no waitlisted
    });
    mockDb.update.mockReturnValue(createChainMock([]));

    await cancelReservation('r1');
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe('transferReservation', () => {
  it('throws when not authenticated', async () => {
    await expect(transferReservation('m1', 'li1', 'li2')).rejects.toThrow('認証が必要です');
  });

  it('throws when member tries to transfer for another member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(transferReservation('other', 'li1', 'li2')).rejects.toThrow('権限がありません');
  });

  it('throws when target instance not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(transferReservation('m1', 'li1', 'li-none')).rejects.toThrow(
      '振替先のレッスンが見つかりません'
    );
  });

  it('throws when target instance is cancelled', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const toInst = lessonInstanceRow({ id: 'li2', isCancelled: true, date: '2099-12-31' });
    mockDb.select.mockReturnValue(createChainMock([toInst]));
    await expect(transferReservation('m1', 'li1', 'li2')).rejects.toThrow(
      '振替先のレッスンは中止されています'
    );
  });

  it('throws when target is at capacity', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const toInst = lessonInstanceRow({
      id: 'li2',
      date: '2099-12-31',
      maxCapacity: 1,
    });
    const existingConfirmed = reservationRow({ id: 'r-other', memberId: 'other' });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([toInst]); // target instance
      return createChainMock([existingConfirmed]); // confirmed at target
    });

    await expect(transferReservation('m1', 'li1', 'li2')).rejects.toThrow(
      '振替先のレッスンは定員に達しています'
    );
  });

  it('succeeds for valid transfer', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const toInst = lessonInstanceRow({ id: 'li2', date: '2099-12-31', maxCapacity: 8 });
    const originalRes = reservationRow({
      memberId: 'm1',
      status: 'confirmed',
      lessonInstanceId: 'li1',
      transferFromInstanceId: null,
    });
    const newRes = reservationRow({
      id: 'r-new',
      memberId: 'm1',
      lessonInstanceId: 'li2',
      status: 'confirmed',
      transferFromInstanceId: 'li1',
    });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([toInst]); // target instance
      if (callCount === 2) return createChainMock([]); // confirmed at target
      if (callCount === 3) return createChainMock([]); // existing to res
      return createChainMock([originalRes]); // original reservation
    });
    mockDb.update.mockReturnValue(createChainMock([]));
    mockDb.insert.mockReturnValue(createChainMock([newRes]));

    const result = await transferReservation('m1', 'li1', 'li2');
    expect(result.status).toBe('confirmed');
    expect(result.transferFromInstanceId).toBe('li1');
  });

  it('throws when already transferred reservation', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const toInst = lessonInstanceRow({ id: 'li3', date: '2099-12-31', maxCapacity: 8 });
    const alreadyTransferred = reservationRow({
      memberId: 'm1',
      status: 'confirmed',
      lessonInstanceId: 'li2',
      transferFromInstanceId: 'li1', // already a transfer
    });

    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createChainMock([toInst]);
      if (callCount === 2) return createChainMock([]);
      if (callCount === 3) return createChainMock([]);
      return createChainMock([alreadyTransferred]);
    });

    await expect(transferReservation('m1', 'li2', 'li3')).rejects.toThrow(
      '振替先の予約を再度振替することはできません'
    );
  });
});

// ── getReservations ───────────────────────────────────

describe('getReservations', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getReservations()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns reservations for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([reservationRow()]));
    const result = await getReservations();
    expect(result).toHaveLength(1);
  });

  it('returns empty array when none exist', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getReservations();
    expect(result).toHaveLength(0);
  });
});

// ── getMemberReservations ─────────────────────────────

describe('getMemberReservations', () => {
  it('throws when not authenticated', async () => {
    await expect(getMemberReservations('m1')).rejects.toThrow('認証が必要です');
  });

  it('throws when member accesses other member reservations', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getMemberReservations('m2')).rejects.toThrow('権限がありません');
  });

  it('returns own reservations', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const joinedRow = {
      reservations: reservationRow(),
      members: memberRow(),
      lesson_instances: lessonInstanceRow(),
      lesson_slots: lessonSlotRow(),
      coaches: coachRow(),
      courts: courtRow(),
    };
    mockDb.select.mockReturnValue(createChainMock([joinedRow]));
    const result = await getMemberReservations('m1');
    expect(result).toHaveLength(1);
  });

  it('admin can view any member reservations', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const joinedRow = {
      reservations: reservationRow({ memberId: 'm2' }),
      members: memberRow({ id: 'm2' }),
      lesson_instances: lessonInstanceRow(),
      lesson_slots: lessonSlotRow(),
      coaches: coachRow(),
      courts: courtRow(),
    };
    mockDb.select.mockReturnValue(createChainMock([joinedRow]));
    const result = await getMemberReservations('m2');
    expect(result).toHaveLength(1);
  });
});

// ── getReservationsForInstance ─────────────────────────

describe('getReservationsForInstance', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getReservationsForInstance('li1')).rejects.toThrow('管理者権限が必要です');
  });

  it('returns reservations for instance', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([reservationRow()]));
    const result = await getReservationsForInstance('li1');
    expect(result).toHaveLength(1);
  });
});

// ── getAllReservationsWithDetails ──────────────────────

describe('getAllReservationsWithDetails', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getAllReservationsWithDetails()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns all reservations with details', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getAllReservationsWithDetails();
    expect(result).toEqual([]);
  });
});
