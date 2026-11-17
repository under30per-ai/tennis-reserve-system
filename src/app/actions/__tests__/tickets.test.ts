import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { ticketTypeRow, memberTicketRow, ticketUsageRow } from './helpers/fixtures';
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

// ── Import after mocks ────────────────────────────────

const {
  issueMemberTicket,
  useTicket,
  getTicketTypes,
  getTicketTypeById,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  getAllMemberTickets,
  getMyTickets,
  getTicketUsageHistory,
} = await import('@/app/actions/tickets');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('issueMemberTicket', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(issueMemberTicket('m1', 'tt1')).rejects.toThrow('管理者権限が必要です');
  });

  it('throws when ticket type not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(issueMemberTicket('m1', 'tt-none')).rejects.toThrow(
      'チケット種別が見つかりません'
    );
  });

  it('issues ticket with correct remaining count and expiry', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const ttRow = ticketTypeRow({ lessonCount: 10, validDays: 90 });
    const mtRow = memberTicketRow({ remainingCount: 10 });

    mockDb.select.mockReturnValue(createChainMock([ttRow]));
    mockDb.insert.mockReturnValue(createChainMock([mtRow]));

    const result = await issueMemberTicket('m1', 'tt1');
    expect(result.remainingCount).toBe(10);
    expect(mockDb.insert).toHaveBeenCalled();
  });
});

describe('useTicket', () => {
  it('throws when not authenticated', async () => {
    await expect(useTicket('mt1', 'r1')).rejects.toThrow('認証が必要です');
  });

  it('throws when ticket not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(useTicket('mt-none', 'r1')).rejects.toThrow('チケットが見つかりません');
  });

  it('throws when member tries to use another members ticket', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const ticket = memberTicketRow({ memberId: 'other-member' });
    mockDb.select.mockReturnValue(createChainMock([ticket]));
    await expect(useTicket('mt1', 'r1')).rejects.toThrow('権限がありません');
  });

  it('throws when ticket is inactive', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const ticket = memberTicketRow({ memberId: 'm1', isActive: false });
    mockDb.select.mockReturnValue(createChainMock([ticket]));
    await expect(useTicket('mt1', 'r1')).rejects.toThrow('無効です');
  });

  it('throws when no remaining count', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const ticket = memberTicketRow({ memberId: 'm1', remainingCount: 0 });
    mockDb.select.mockReturnValue(createChainMock([ticket]));
    await expect(useTicket('mt1', 'r1')).rejects.toThrow('残り回数がありません');
  });

  it('throws when ticket is expired', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const ticket = memberTicketRow({
      memberId: 'm1',
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    });
    mockDb.select.mockReturnValue(createChainMock([ticket]));
    await expect(useTicket('mt1', 'r1')).rejects.toThrow('有効期限が切れています');
  });

  it('uses ticket and returns usage record', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const ticket = memberTicketRow({
      memberId: 'm1',
      remainingCount: 5,
      expiresAt: new Date('2099-12-31T00:00:00Z'),
    });
    const usage = ticketUsageRow();

    mockDb.select.mockReturnValue(createChainMock([ticket]));

    // Mock transaction
    const txMock = {
      update: vi.fn().mockReturnValue(createChainMock([])),
      insert: vi.fn().mockReturnValue(createChainMock([usage])),
    };
    mockDb.transaction.mockImplementation(async (fn: Function) => fn(txMock));

    const result = await useTicket('mt1', 'r1');
    expect(result.memberTicketId).toBe('mt1');
    expect(result.reservationId).toBe('r1');
  });
});

// ── getTicketTypes ────────────────────────────────────

describe('getTicketTypes', () => {
  it('throws when not authenticated', async () => {
    await expect(getTicketTypes()).rejects.toThrow('認証が必要です');
  });

  it('returns ticket types', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([ticketTypeRow()]));
    const result = await getTicketTypes();
    expect(result).toHaveLength(1);
  });
});

// ── getTicketTypeById ─────────────────────────────────

describe('getTicketTypeById', () => {
  it('throws when not authenticated', async () => {
    await expect(getTicketTypeById('tt1')).rejects.toThrow('認証が必要です');
  });

  it('returns ticket type when found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([ticketTypeRow()]));
    const result = await getTicketTypeById('tt1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('10回券');
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getTicketTypeById('tt-none')).toBeNull();
  });
});

// ── createTicketType ──────────────────────────────────

describe('createTicketType', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createTicketType({
      name: 'Test', description: 'Test', lessonCount: 5, validDays: 30, price: 5000,
    })).rejects.toThrow('管理者権限が必要です');
  });

  it('creates ticket type for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([ticketTypeRow({ id: 'tt-new' })]));
    const result = await createTicketType({
      name: 'New', description: 'Desc', lessonCount: 5, validDays: 60, price: 8000,
    });
    expect(result.id).toBe('tt-new');
  });
});

// ── updateTicketType ──────────────────────────────────

describe('updateTicketType', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateTicketType('tt1', { name: 'X' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates ticket type', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([ticketTypeRow({ name: 'Updated' })]));
    const result = await updateTicketType('tt1', { name: 'Updated' });
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateTicketType('tt-none', { name: 'X' })).toBeNull();
  });
});

// ── deleteTicketType ──────────────────────────────────

describe('deleteTicketType', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteTicketType('tt1')).rejects.toThrow('管理者権限が必要です');
  });

  it('deletes ticket type for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    await deleteTicketType('tt1');
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// ── getAllMemberTickets ────────────────────────────────

describe('getAllMemberTickets', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getAllMemberTickets()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns all member tickets for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const joinedRow = {
      member_tickets: memberTicketRow(),
      ticket_types: ticketTypeRow(),
    };
    mockDb.select.mockReturnValue(createChainMock([joinedRow]));
    const result = await getAllMemberTickets();
    expect(result).toHaveLength(1);
  });
});

// ── getMyTickets ──────────────────────────────────────

describe('getMyTickets', () => {
  it('throws when not authenticated', async () => {
    await expect(getMyTickets()).rejects.toThrow('認証が必要です');
  });

  it('returns own tickets for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const joinedRow = {
      member_tickets: memberTicketRow(),
      ticket_types: ticketTypeRow(),
    };
    mockDb.select.mockReturnValue(createChainMock([joinedRow]));
    const result = await getMyTickets();
    expect(result).toHaveLength(1);
  });
});

// ── getTicketUsageHistory ─────────────────────────────

describe('getTicketUsageHistory', () => {
  it('throws when not authenticated', async () => {
    await expect(getTicketUsageHistory('mt1')).rejects.toThrow('認証が必要です');
  });

  it('throws when member accesses other member ticket history', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([memberTicketRow({ memberId: 'other' })]));
    await expect(getTicketUsageHistory('mt1')).rejects.toThrow('権限がありません');
  });

  it('returns usage history for own ticket', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([memberTicketRow({ memberId: 'm1' })]);
      return createChainMock([ticketUsageRow()]);
    });
    const result = await getTicketUsageHistory('mt1');
    expect(result).toHaveLength(1);
  });

  it('admin can view any ticket history', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([memberTicketRow({ memberId: 'other' })]);
      return createChainMock([]);
    });
    const result = await getTicketUsageHistory('mt1');
    expect(result).toEqual([]);
  });
});
