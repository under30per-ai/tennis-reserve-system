/**
 * Factory functions for domain model test fixtures.
 * Each returns a complete object with sensible defaults that can be overridden.
 */

// Row-level fixtures (as returned from DB, with Date objects for timestamps)
const d = (iso: string) => new Date(iso);
const NOW = d('2024-06-01T00:00:00Z');

export function memberRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    name: '田中太郎',
    nameKana: 'タナカタロウ',
    email: 'tanaka@test.com',
    phone: '090-1234-5678',
    level: 'intermediate',
    membershipType: 'regular',
    joinDate: '2024-01-01',
    isActive: true,
    notes: '',
    avatarColor: '#3B82F6',
    remainingTransfers: 2,
    password: 'dummy:hash',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function lessonInstanceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'li1',
    lessonSlotId: 'ls1',
    date: '2024-12-15',
    coachId: 'c1',
    courtId: 'ct1',
    startTime: '10:00',
    endTime: '11:00',
    maxCapacity: 8,
    isCancelled: false,
    cancelReason: '',
    notes: '',
    createdAt: NOW,
    ...overrides,
  };
}

export function reservationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    memberId: 'm1',
    lessonInstanceId: 'li1',
    status: 'confirmed',
    reservedAt: NOW,
    cancelledAt: null,
    transferFromInstanceId: null,
    transferToInstanceId: null,
    waitlistPosition: null,
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'テニスラケット',
    description: '高品質ラケット',
    category: 'racket',
    price: 25000,
    stock: 10,
    sku: null,
    barcode: null,
    imageUrl: null,
    isActive: true,
    displayOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function shopOrderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'so1',
    memberId: 'm1',
    orderNumber: 'ORD-20240601-0001',
    status: 'pending',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    subtotal: 25000,
    tax: 2500,
    totalAmount: 27500,
    notes: '',
    orderSource: 'online',
    posTransactionId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function shopOrderItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'soi1',
    orderId: 'so1',
    productId: 'p1',
    productName: 'テニスラケット',
    unitPrice: 25000,
    quantity: 1,
    subtotal: 25000,
    createdAt: NOW,
    ...overrides,
  };
}

export function chatMessageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cm1',
    senderId: 'm1',
    senderRole: 'member',
    receiverId: 'admin',
    message: 'こんにちは',
    isRead: false,
    createdAt: NOW,
    ...overrides,
  };
}

export function ticketTypeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tt1',
    name: '10回券',
    description: '10回分のレッスンチケット',
    lessonCount: 10,
    validDays: 90,
    price: 15000,
    isActive: true,
    createdAt: NOW,
    ...overrides,
  };
}

export function memberTicketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mt1',
    memberId: 'm1',
    ticketTypeId: 'tt1',
    remainingCount: 5,
    purchasedAt: NOW,
    expiresAt: d('2025-01-01T00:00:00Z'),
    isActive: true,
    ...overrides,
  };
}

export function ticketUsageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tu1',
    memberTicketId: 'mt1',
    reservationId: 'r1',
    usedAt: NOW,
    ...overrides,
  };
}

export function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'n1',
    memberId: 'm1',
    type: 'general',
    title: 'テスト通知',
    message: 'テストメッセージ',
    isRead: false,
    relatedId: null,
    createdAt: NOW,
    ...overrides,
  };
}

export function lessonSlotRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ls1',
    title: 'テストレッスン',
    level: 'intermediate',
    coachId: 'c1',
    courtId: 'ct1',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:00',
    maxCapacity: 8,
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceStartDate: '2024-01-01',
    recurrenceEndDate: null,
    specificDate: null,
    monthlyWeekNumber: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
