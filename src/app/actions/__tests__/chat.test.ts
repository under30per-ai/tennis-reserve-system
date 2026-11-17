import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { chatMessageRow, memberRow } from './helpers/fixtures';
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
}));

// ── Import after mocks ────────────────────────────────

const { sendMessage } = await import('@/app/actions/chat');

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('sendMessage', () => {
  it('throws when not authenticated', async () => {
    await expect(sendMessage('admin', 'Hello')).rejects.toThrow('認証が必要です');
  });

  it('throws for empty message', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(sendMessage('admin', '')).rejects.toThrow('メッセージを入力してください');
  });

  it('throws for whitespace-only message', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(sendMessage('admin', '   ')).rejects.toThrow('メッセージを入力してください');
  });

  it('throws for message exceeding 5000 chars', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const longMessage = 'あ'.repeat(5001);
    await expect(sendMessage('admin', longMessage)).rejects.toThrow('5000文字以内');
  });

  it('throws when message contains prohibited content', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(sendMessage('admin', '死ね')).rejects.toThrow('不適切な表現');
  });

  it('throws when member sends to non-admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(sendMessage('other-member', '普通のメッセージ')).rejects.toThrow(
      '会員同士の直接メッセージは利用できません'
    );
  });

  it('succeeds when member sends to admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const row = chatMessageRow();
    mockDb.insert.mockReturnValue(createChainMock([row]));

    const result = await sendMessage('admin', 'こんにちは');
    expect(result.message).toBe('こんにちは');
    expect(result.senderRole).toBe('member');
  });

  it('throws when admin sends to non-existent member', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(sendMessage('nonexistent', '返信です')).rejects.toThrow(
      '送信先の会員が見つかりません'
    );
  });

  it('succeeds when admin sends to existing member', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    const member = memberRow();
    const row = chatMessageRow({
      senderId: 'admin',
      senderRole: 'admin',
      receiverId: 'm1',
      message: '返信です',
    });

    mockDb.select.mockReturnValue(createChainMock([member]));
    mockDb.insert.mockReturnValue(createChainMock([row]));

    const result = await sendMessage('m1', '返信です');
    expect(result.senderRole).toBe('admin');
    expect(result.receiverId).toBe('m1');
  });
});
