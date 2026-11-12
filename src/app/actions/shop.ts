'use server';

import { db } from '@/db';
import { products, shopOrders, shopOrderItems, members } from '@/db/schema';
import { toProduct, toShopOrder, toShopOrderItem } from '@/db/mappers';
import { eq, and, desc, sql } from 'drizzle-orm';
import type {
  Product,
  ProductCategory,
  ShopOrder,
  ShopOrderItem,
  ShopOrderWithItems,
  ShopOrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/domain/models';
import { requireAuth, requireAdmin } from '@/app/actions/auth';
import { withAdminWrite } from '@/app/actions/admin-guard';
import { buildPartialUpdate } from '@/lib/db-utils';
import { writeAuditLog } from '@/lib/audit-log';
import { TAX_RATE } from '@/lib/constants';

// ── Admin: Products ───────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  await requireAdmin();
  const rows = await db
    .select()
    .from(products)
    .orderBy(products.displayOrder, desc(products.createdAt))
    .limit(1000);
  return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  await requireAdmin();
  const rows = await db.select().from(products).where(eq(products.id, id));
  return rows.length > 0 ? toProduct(rows[0]) : null;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  displayOrder?: number;
}): Promise<Product> {
  return withAdminWrite(async () => {
    const rows = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description ?? '',
        category: data.category,
        price: data.price,
        stock: data.stock,
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
        imageUrl: data.imageUrl ?? null,
        displayOrder: data.displayOrder ?? 0,
      })
      .returning();
    await writeAuditLog({ actorId: 'admin', action: 'create', targetType: 'product', targetId: rows[0].id });
    return toProduct(rows[0]);
  });
}

const PRODUCT_UPDATE_KEYS = [
  'name', 'description', 'category', 'price', 'stock',
  'sku', 'barcode', 'imageUrl', 'displayOrder', 'isActive',
] as const;

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    stock: number;
    sku: string | null;
    barcode: string | null;
    imageUrl: string | null;
    displayOrder: number;
    isActive: boolean;
  }>
): Promise<Product | null> {
  return withAdminWrite(async () => {
    const values = buildPartialUpdate(data, PRODUCT_UPDATE_KEYS, { updatedAt: new Date() });
    const rows = await db
      .update(products)
      .set(values)
      .where(eq(products.id, id))
      .returning();
    if (rows.length === 0) return null;
    await writeAuditLog({ actorId: 'admin', action: 'update', targetType: 'product', targetId: id });
    return toProduct(rows[0]);
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return withAdminWrite(async () => {
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
    await writeAuditLog({ actorId: 'admin', action: 'soft_delete', targetType: 'product', targetId: id });
  });
}

// ── Admin: Orders ─────────────────────────────────────

export async function getShopOrders(): Promise<ShopOrderWithItems[]> {
  await requireAdmin();
  const orderRows = await db
    .select()
    .from(shopOrders)
    .orderBy(desc(shopOrders.createdAt))
    .limit(1000);

  if (orderRows.length === 0) return [];

  const orders = orderRows.map(toShopOrder);
  const orderIds = orders.map((o) => o.id);

  const itemRows = await db
    .select()
    .from(shopOrderItems)
    .where(sql`${shopOrderItems.orderId} = ANY(${orderIds})`);
  const allItems = itemRows.map(toShopOrderItem);

  const memberIds = [...new Set(orders.map((o) => o.memberId))];
  const memberRows = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(sql`${members.id} = ANY(${memberIds})`);
  const memberMap = new Map(memberRows.map((m) => [m.id, m.name]));

  return orders.map((order) => ({
    ...order,
    items: allItems.filter((i) => i.orderId === order.id),
    memberName: memberMap.get(order.memberId) ?? '不明',
  }));
}

export async function getShopOrderById(id: string): Promise<ShopOrderWithItems | null> {
  await requireAdmin();
  const orderRows = await db.select().from(shopOrders).where(eq(shopOrders.id, id));
  if (orderRows.length === 0) return null;
  const order = toShopOrder(orderRows[0]);

  const itemRows = await db
    .select()
    .from(shopOrderItems)
    .where(eq(shopOrderItems.orderId, id));
  const items = itemRows.map(toShopOrderItem);

  const memberRows = await db
    .select({ name: members.name })
    .from(members)
    .where(eq(members.id, order.memberId));
  const memberName = memberRows.length > 0 ? memberRows[0].name : '不明';

  return { ...order, items, memberName };
}

export async function updateShopOrderStatus(
  id: string,
  data: { status?: ShopOrderStatus; paymentStatus?: PaymentStatus }
): Promise<ShopOrder | null> {
  return withAdminWrite(async () => {
    const existing = await db.select().from(shopOrders).where(eq(shopOrders.id, id));
    if (existing.length === 0) return null;

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) values.status = data.status;
    if (data.paymentStatus !== undefined) values.paymentStatus = data.paymentStatus;

    // キャンセル時は在庫を戻す
    if (data.status === 'cancelled' && existing[0].status !== 'cancelled') {
      const itemRows = await db
        .select()
        .from(shopOrderItems)
        .where(eq(shopOrderItems.orderId, id));
      for (const item of itemRows) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    }

    const result = await db
      .update(shopOrders)
      .set(values)
      .where(eq(shopOrders.id, id))
      .returning();

    if (result.length === 0) return null;
    await writeAuditLog({ actorId: 'admin', action: 'update_status', targetType: 'shop_order', targetId: id });
    return toShopOrder(result[0]);
  });
}

// ── Member: Browse Products ───────────────────────────

export async function getActiveProducts(category?: ProductCategory): Promise<Product[]> {
  await requireAuth();
  const conditions = [eq(products.isActive, true)];
  if (category) conditions.push(eq(products.category, category));

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(products.displayOrder, desc(products.createdAt))
    .limit(1000);
  return rows.map(toProduct);
}

export async function getProductDetail(id: string): Promise<Product | null> {
  await requireAuth();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isActive, true)));
  return rows.length > 0 ? toProduct(rows[0]) : null;
}

// ── Member: Orders ────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await db
    .select({ orderNumber: shopOrders.orderNumber })
    .from(shopOrders)
    .where(sql`${shopOrders.orderNumber} LIKE ${prefix + '%'}`)
    .orderBy(desc(shopOrders.orderNumber))
    .limit(1);

  let seq = 1;
  if (lastOrder.length > 0) {
    const lastSeq = parseInt(lastOrder[0].orderNumber.split('-').pop() ?? '0', 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

export async function createShopOrder(data: {
  items: { productId: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  notes?: string;
}): Promise<ShopOrder> {
  const user = await requireAuth();
  if (!user.memberId) throw new Error('会員情報が見つかりません');
  if (data.items.length === 0) throw new Error('商品が選択されていません');
  if (data.items.length > 50) throw new Error('一度に注文できる商品は50種類までです');

  // 数量バリデーション
  for (const item of data.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error('数量は1以上の整数を指定してください');
    }
  }

  // 在庫確認
  const productIds = data.items.map((i) => i.productId);
  const productRows = await db
    .select()
    .from(products)
    .where(sql`${products.id} = ANY(${productIds})`);
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error('商品が見つかりません');
    if (!product.isActive) throw new Error(`「${product.name}」は現在販売していません`);
    if (product.stock < item.quantity) throw new Error(`「${product.name}」の在庫が不足しています（残り${product.stock}点）`);
  }

  const orderNumber = await generateOrderNumber();

  // 小計計算
  let subtotal = 0;
  const orderItems = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;
    return {
      productId: item.productId,
      productName: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    };
  });

  const tax = Math.floor(subtotal * TAX_RATE);
  const totalAmount = subtotal + tax;

  // 在庫減少（stock >= quantity ガードで負の在庫を防止）
  for (const item of data.items) {
    const updated = await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(and(eq(products.id, item.productId), sql`${products.stock} >= ${item.quantity}`))
      .returning();
    if (updated.length === 0) {
      throw new Error('在庫が不足しています。再度お試しください。');
    }
  }

  // 注文作成
  const orderRows = await db
    .insert(shopOrders)
    .values({
      memberId: user.memberId!,
      orderNumber,
      status: 'pending',
      paymentMethod: data.paymentMethod,
      paymentStatus: 'unpaid',
      subtotal,
      tax,
      totalAmount,
      notes: (data.notes ?? '').slice(0, 2000),
      orderSource: 'online',
    })
    .returning();
  const order = orderRows[0];

  // 注文明細作成
  for (const item of orderItems) {
    await db.insert(shopOrderItems).values({
      orderId: order.id,
      ...item,
    });
  }

  return toShopOrder(order);
}

export async function getMyShopOrders(): Promise<ShopOrder[]> {
  const user = await requireAuth();
  if (!user.memberId) return [];
  const rows = await db
    .select()
    .from(shopOrders)
    .where(eq(shopOrders.memberId, user.memberId))
    .orderBy(desc(shopOrders.createdAt))
    .limit(1000);
  return rows.map(toShopOrder);
}

export async function getMyShopOrderDetail(orderId: string): Promise<(ShopOrder & { items: ShopOrderItem[] }) | null> {
  const user = await requireAuth();
  if (!user.memberId) return null;

  const orderRows = await db
    .select()
    .from(shopOrders)
    .where(and(eq(shopOrders.id, orderId), eq(shopOrders.memberId, user.memberId)));
  if (orderRows.length === 0) return null;
  const order = toShopOrder(orderRows[0]);

  const itemRows = await db
    .select()
    .from(shopOrderItems)
    .where(eq(shopOrderItems.orderId, orderId));
  const items = itemRows.map(toShopOrderItem);

  return { ...order, items };
}

export async function cancelMyShopOrder(orderId: string): Promise<ShopOrder> {
  const user = await requireAuth();
  if (!user.memberId) throw new Error('会員情報が見つかりません');

  const orderRows = await db
    .select()
    .from(shopOrders)
    .where(and(eq(shopOrders.id, orderId), eq(shopOrders.memberId, user.memberId)));
  if (orderRows.length === 0) throw new Error('注文が見つかりません');

  const order = orderRows[0];
  if (order.status !== 'pending') throw new Error('この注文はキャンセルできません（注文受付状態のみキャンセル可能）');

  // 在庫戻し
  const itemRows = await db
    .select()
    .from(shopOrderItems)
    .where(eq(shopOrderItems.orderId, orderId));
  for (const item of itemRows) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  // ステータス更新
  const rows = await db
    .update(shopOrders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(shopOrders.id, orderId))
    .returning();

  return toShopOrder(rows[0]);
}
