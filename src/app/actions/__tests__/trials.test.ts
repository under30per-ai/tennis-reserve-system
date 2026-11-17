import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { trialApplicationRow } from './helpers/fixtures';
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

vi.mock('@/lib/email', () => ({
  sendTrialConfirmation: vi.fn().mockResolvedValue(undefined),
  sendTrialStatusUpdate: vi.fn().mockResolvedValue(undefined),
  sendVerificationCode: vi.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ────────────────────────────────

const {
  applyForTrial,
  getTrialApplications,
  getTrialById,
  updateTrialStatus,
} = await import('@/app/actions/trials');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('applyForTrial', () => {
  const validData = {
    name: '山田花子',
    nameKana: 'ヤマダハナコ',
    email: 'yamada@test.com',
    phone: '090-9999-8888',
    preferredLevel: 'beginner' as const,
    preferredDate: '2099-03-15',
    preferredTime: '10:00',
    message: 'よろしくお願いします',
  };

  it('throws for empty name', async () => {
    await expect(applyForTrial({ ...validData, name: '' })).rejects.toThrow('お名前');
  });

  it('throws for empty nameKana', async () => {
    await expect(applyForTrial({ ...validData, nameKana: '' })).rejects.toThrow('カナ');
  });

  it('throws for invalid email', async () => {
    await expect(applyForTrial({ ...validData, email: 'bad' })).rejects.toThrow('メールアドレス');
  });

  it('throws for invalid phone', async () => {
    await expect(applyForTrial({ ...validData, phone: 'abc' })).rejects.toThrow('電話番号');
  });

  it('throws for invalid level', async () => {
    await expect(applyForTrial({ ...validData, preferredLevel: 'invalid' as any })).rejects.toThrow('レベル');
  });

  it('throws for invalid date format', async () => {
    await expect(applyForTrial({ ...validData, preferredDate: 'bad' })).rejects.toThrow('希望日');
  });

  it('throws for empty time', async () => {
    await expect(applyForTrial({ ...validData, preferredTime: '' })).rejects.toThrow('希望時間');
  });

  it('creates application with valid data', async () => {
    mockDb.insert.mockReturnValue(createChainMock([trialApplicationRow()]));
    const result = await applyForTrial(validData);
    expect(result.name).toBe('山田花子');
    expect(result.status).toBe('pending');
  });

  it('throws when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterMs: 300000 });
    await expect(applyForTrial(validData)).rejects.toThrow('上限');
  });
});

describe('getTrialApplications', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getTrialApplications()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns applications for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([trialApplicationRow()]));
    expect(await getTrialApplications()).toHaveLength(1);
  });
});

describe('getTrialById', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getTrialById('ta1')).rejects.toThrow('管理者権限が必要です');
  });

  it('returns application', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([trialApplicationRow()]));
    const r = await getTrialById('ta1');
    expect(r).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getTrialById('ta-none')).toBeNull();
  });
});

describe('updateTrialStatus', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateTrialStatus('ta1', 'approved')).rejects.toThrow('管理者権限が必要です');
  });

  it('updates status for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([trialApplicationRow({ status: 'approved', reviewedAt: new Date() })]));
    const r = await updateTrialStatus('ta1', 'approved', 'OK');
    expect(r).not.toBeNull();
    expect(r!.status).toBe('approved');
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateTrialStatus('ta-none', 'approved')).toBeNull();
  });

  it('sends email on status update', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([trialApplicationRow({ status: 'approved' })]));
    await updateTrialStatus('ta1', 'approved');
    const { sendTrialStatusUpdate } = await import('@/lib/email');
    expect(sendTrialStatusUpdate).toHaveBeenCalled();
  });
});
