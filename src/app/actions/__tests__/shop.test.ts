import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockCookieStore,
  setAuthenticatedUser,
  ADMIN_USER,
  MEMBER_USER,
} from './helpers/mock-auth';
import { productRow, shopOrderRow, shopOrderItemRow } from './helpers/fixtures';
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

const { createShopOrder, cancelMyShopOrder } = await import(
  '@/app/actions/shop'
);

beforeEach(() => {
  mockCookieStore._store.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────

describe('createShopOrder', () => {
  it('throws when not authenticated', async () => {
    await expect(
      createShopOrder({ items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'cash' })
    ).rejects.toThrow('認証が必要です');
  });

  it('throws when items array is empty', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(
      createShopOrder({ items: [], paymentMethod: 'cash' })
    ).rejects.toThrow('商品が選択されていません');
  });

  it('throws for invalid quantity', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(
      createShopOrder({ items: [{ productId: 'p1', quantity: 0 }], paymentMethod: 'cash' })
    ).rejects.toThrow('数量は1以上の整数');
  });

  it('throws when product not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(
      createShopOrder({ items: [{ productId: 'p-none', quantity: 1 }], paymentMethod: 'cash' })
    ).rejects.toThrow('商品が見つかりません');
  });

  it('throws when product is inactive', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const inactiveProduct = productRow({ isActive: false });
    mockDb.select.mockReturnValue(createChainMock([inactiveProduct]));
    await expect(
      createShopOrder({ items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'cash' })
    ).rejects.toThrow('販売していません');
  });

  it('throws when stock is insufficient', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const lowStockProduct = productRow({ stock: 2 });
    mockDb.select.mockReturnValue(createChainMock([lowStockProduct]));
    await expect(
      createShopOrder({ items: [{ productId: 'p1', quantity: 5 }], paymentMethod: 'cash' })
    ).rejects.toThrow('在庫が不足');
  });

  it('creates order with correct tax calculation', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const product = productRow({ price: 10000, stock: 10 });

    // 1) product lookup, 2) orderNumber generation
    let selectCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCount++;
      if (selectCount === 1) return createChainMock([product]); // products
      return createChainMock([]); // last order number
    });

    const orderRow = shopOrderRow({
      subtotal: 10000,
      tax: 1000,
      totalAmount: 11000,
    });
    mockDb.update.mockReturnValue(createChainMock([product])); // stock deduction
    mockDb.insert.mockReturnValue(createChainMock([orderRow])); // order + items

    const result = await createShopOrder({
      items: [{ productId: 'p1', quantity: 1 }],
      paymentMethod: 'cash',
    });
    expect(result.subtotal).toBe(10000);
    expect(result.tax).toBe(1000);
    expect(result.totalAmount).toBe(11000);
  });

  it('throws for too many item types', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const items = Array.from({ length: 51 }, (_, i) => ({
      productId: `p${i}`,
      quantity: 1,
    }));
    await expect(
      createShopOrder({ items, paymentMethod: 'cash' })
    ).rejects.toThrow('50種類まで');
  });
});

describe('cancelMyShopOrder', () => {
  it('throws when not authenticated', async () => {
    await expect(cancelMyShopOrder('so1')).rejects.toThrow('認証が必要です');
  });

  it('throws when order not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    await expect(cancelMyShopOrder('so-none')).rejects.toThrow('注文が見つかりません');
  });

  it('throws when order is not pending', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const order = shopOrderRow({ memberId: 'm1', status: 'confirmed' });
    mockDb.select.mockReturnValue(createChainMock([order]));
    await expect(cancelMyShopOrder('so1')).rejects.toThrow('キャンセルできません');
  });

  it('cancels pending order and restores stock', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    const order = shopOrderRow({ memberId: 'm1', status: 'pending' });
    const item = shopOrderItemRow();
    const cancelledOrder = shopOrderRow({ memberId: 'm1', status: 'cancelled' });

    let selectCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCount++;
      if (selectCount === 1) return createChainMock([order]); // order lookup
      return createChainMock([item]); // items for stock restore
    });
    mockDb.update.mockReturnValue(createChainMock([cancelledOrder]));

    const result = await cancelMyShopOrder('so1');
    expect(result.status).toBe('cancelled');
    // update called: 1 for stock restore, 1 for order status
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });
});
