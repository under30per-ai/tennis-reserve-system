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

const { issueMemberTicket, useTicket } = await import('@/app/actions/tickets');

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
