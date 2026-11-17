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

const {
  createShopOrder,
  cancelMyShopOrder,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getShopOrders,
  getShopOrderById,
  updateShopOrderStatus,
  getActiveProducts,
  getProductDetail,
  getMyShopOrders,
  getMyShopOrderDetail,
} = await import('@/app/actions/shop');

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

// ── getProducts (admin) ───────────────────────────────

describe('getProducts', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getProducts()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns products for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([productRow()]));
    const result = await getProducts();
    expect(result).toHaveLength(1);
  });
});

// ── getProductById ────────────────────────────────────

describe('getProductById', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getProductById('p1')).rejects.toThrow('管理者権限が必要です');
  });

  it('returns product when found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([productRow()]));
    const result = await getProductById('p1');
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getProductById('p-none')).toBeNull();
  });
});

// ── createProduct ─────────────────────────────────────

describe('createProduct', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(createProduct({
      name: 'Test', description: '', category: 'racket', price: 1000, stock: 5,
    })).rejects.toThrow('管理者権限が必要です');
  });

  it('creates product for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.insert.mockReturnValue(createChainMock([productRow({ id: 'p-new' })]));
    const result = await createProduct({
      name: 'New', description: 'Desc', category: 'racket', price: 5000, stock: 10,
    });
    expect(result.id).toBe('p-new');
  });
});

// ── updateProduct ─────────────────────────────────────

describe('updateProduct', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateProduct('p1', { name: 'Updated' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates product for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([productRow({ name: 'Updated' })]));
    const result = await updateProduct('p1', { name: 'Updated' });
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateProduct('p-none', { name: 'X' })).toBeNull();
  });
});

// ── deleteProduct ─────────────────────────────────────

describe('deleteProduct', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(deleteProduct('p1')).rejects.toThrow('管理者権限が必要です');
  });

  it('soft-deletes product for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    await deleteProduct('p1');
    expect(mockDb.update).toHaveBeenCalled();
  });
});

// ── getShopOrders ─────────────────────────────────────

describe('getShopOrders', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getShopOrders()).rejects.toThrow('管理者権限が必要です');
  });

  it('returns orders for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    const result = await getShopOrders();
    expect(result).toEqual([]);
  });
});

// ── getShopOrderById ──────────────────────────────────

describe('getShopOrderById', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(getShopOrderById('so1')).rejects.toThrow('管理者権限が必要です');
  });

  it('returns order with items', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([shopOrderRow()]);
      return createChainMock([shopOrderItemRow()]);
    });
    const result = await getShopOrderById('so1');
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getShopOrderById('so-none')).toBeNull();
  });
});

// ── updateShopOrderStatus ─────────────────────────────

describe('updateShopOrderStatus', () => {
  it('throws when not admin', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    await expect(updateShopOrderStatus('so1', { status: 'confirmed' })).rejects.toThrow('管理者権限が必要です');
  });

  it('updates order status for admin', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([shopOrderRow()])); // existing order lookup
    mockDb.update.mockReturnValue(createChainMock([shopOrderRow({ status: 'confirmed' })]));
    const result = await updateShopOrderStatus('so1', { status: 'confirmed' });
    expect(result).not.toBeNull();
  });

  it('restores stock when cancelling', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.select.mockReturnValue(createChainMock([shopOrderItemRow()]));
    mockDb.update.mockReturnValue(createChainMock([shopOrderRow({ status: 'cancelled' })]));
    await updateShopOrderStatus('so1', { status: 'cancelled' });
    // update called: stock restore + order status
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, ADMIN_USER);
    mockDb.update.mockReturnValue(createChainMock([]));
    expect(await updateShopOrderStatus('so-none', { status: 'confirmed' })).toBeNull();
  });
});

// ── getActiveProducts ─────────────────────────────────

describe('getActiveProducts', () => {
  it('throws when not authenticated', async () => {
    await expect(getActiveProducts()).rejects.toThrow('認証が必要です');
  });

  it('returns active products', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([productRow()]));
    const result = await getActiveProducts();
    expect(result).toHaveLength(1);
  });

  it('filters by category', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([productRow({ category: 'racket' })]));
    const result = await getActiveProducts('racket');
    expect(result).toHaveLength(1);
  });
});

// ── getProductDetail ──────────────────────────────────

describe('getProductDetail', () => {
  it('throws when not authenticated', async () => {
    await expect(getProductDetail('p1')).rejects.toThrow('認証が必要です');
  });

  it('returns product detail', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([productRow()]));
    const result = await getProductDetail('p1');
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getProductDetail('p-none')).toBeNull();
  });
});

// ── getMyShopOrders ───────────────────────────────────

describe('getMyShopOrders', () => {
  it('throws when not authenticated', async () => {
    await expect(getMyShopOrders()).rejects.toThrow('認証が必要です');
  });

  it('returns own orders for member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([shopOrderRow()]));
    const result = await getMyShopOrders();
    expect(result).toHaveLength(1);
  });
});

// ── getMyShopOrderDetail ──────────────────────────────

describe('getMyShopOrderDetail', () => {
  it('throws when not authenticated', async () => {
    await expect(getMyShopOrderDetail('so1')).rejects.toThrow('認証が必要です');
  });

  it('returns own order detail', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    let c = 0;
    mockDb.select.mockImplementation(() => {
      c++;
      if (c === 1) return createChainMock([shopOrderRow({ memberId: 'm1' })]);
      return createChainMock([shopOrderItemRow()]);
    });
    const result = await getMyShopOrderDetail('so1');
    expect(result).not.toBeNull();
  });

  it('returns null when not found', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getMyShopOrderDetail('so-none')).toBeNull();
  });

  it('returns null when order belongs to other member', async () => {
    setAuthenticatedUser(mockCookieStore, MEMBER_USER);
    // DB WHERE clause includes memberId check, so no rows returned for other member
    mockDb.select.mockReturnValue(createChainMock([]));
    expect(await getMyShopOrderDetail('so1')).toBeNull();
  });
});
