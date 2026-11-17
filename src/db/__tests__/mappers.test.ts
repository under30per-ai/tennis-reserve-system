import { describe, it, expect } from 'vitest';
import {
  toMember,
  toCoach,
  toCourt,
  toLessonSlot,
  toLessonInstance,
  toReservation,
  toLessonRecord,
  toNotification,
  toTicketType,
  toMemberTicket,
  toTicketUsage,
  toTrialApplication,
  toEvent,
  toEventRegistration,
  toChatMessage,
  toProduct,
  toShopOrder,
  toShopOrderItem,
} from '@/db/mappers';

// Helper: create a Date for row fields
const d = (iso: string) => new Date(iso);

describe('toMember', () => {
  it('maps row to Member with ISO date strings', () => {
    const row = {
      id: 'm1',
      name: '田中',
      nameKana: 'タナカ',
      email: 'tanaka@test.com',
      phone: '090-1234-5678',
      level: 'beginner',
      membershipType: 'regular',
      joinDate: '2024-01-01',
      isActive: true,
      notes: '',
      avatarColor: '#EF4444',
      remainingTransfers: 2,
      password: 'hashed',
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-06-01T00:00:00Z'),
    };
    const result = toMember(row as never);
    expect(result.id).toBe('m1');
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2024-06-01T00:00:00.000Z');
    expect(result).not.toHaveProperty('password');
  });
});

describe('toCoach', () => {
  it('maps row with specialties and certifications arrays', () => {
    const row = {
      id: 'c1',
      name: 'Coach',
      nameKana: 'コーチ',
      email: 'c@test.com',
      phone: '',
      specialties: ['beginner', 'intermediate'],
      bio: 'bio',
      certifications: ['cert1'],
      avatarColor: '#EF4444',
      isActive: true,
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toCoach(row as never);
    expect(result.specialties).toEqual(['beginner', 'intermediate']);
    expect(result.certifications).toEqual(['cert1']);
  });
});

describe('toCourt', () => {
  it('maps row to Court', () => {
    const row = {
      id: 'ct1',
      name: 'Court A',
      type: 'indoor',
      surface: 'hard',
      capacity: 4,
      isActive: true,
    };
    const result = toCourt(row as never);
    expect(result.type).toBe('indoor');
    expect(result.surface).toBe('hard');
  });
});

describe('toLessonSlot', () => {
  it('maps nullable fields correctly', () => {
    const row = {
      id: 'ls1',
      title: 'Slot',
      level: 'beginner',
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
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toLessonSlot(row as never);
    expect(result.recurrenceEndDate).toBeNull();
    expect(result.specificDate).toBeNull();
    expect(result.monthlyWeekNumber).toBeNull();
  });
});

describe('toLessonInstance', () => {
  it('converts createdAt to ISO string', () => {
    const row = {
      id: 'li1',
      lessonSlotId: 'ls1',
      date: '2024-03-15',
      coachId: 'c1',
      courtId: 'ct1',
      startTime: '10:00',
      endTime: '11:00',
      maxCapacity: 8,
      isCancelled: false,
      cancelReason: '',
      notes: '',
      createdAt: d('2024-03-15T00:00:00Z'),
    };
    const result = toLessonInstance(row as never);
    expect(result.createdAt).toBe('2024-03-15T00:00:00.000Z');
  });
});

describe('toReservation', () => {
  it('maps nullable cancelledAt and transfer fields', () => {
    const row = {
      id: 'r1',
      memberId: 'm1',
      lessonInstanceId: 'li1',
      status: 'confirmed',
      reservedAt: d('2024-03-15T00:00:00Z'),
      cancelledAt: null,
      transferFromInstanceId: null,
      transferToInstanceId: null,
      waitlistPosition: null,
      notes: '',
      createdAt: d('2024-03-15T00:00:00Z'),
      updatedAt: d('2024-03-15T00:00:00Z'),
    };
    const result = toReservation(row as never);
    expect(result.cancelledAt).toBeNull();
    expect(result.transferFromInstanceId).toBeNull();
    expect(result.waitlistPosition).toBeNull();
  });

  it('converts cancelledAt when present', () => {
    const row = {
      id: 'r2',
      memberId: 'm1',
      lessonInstanceId: 'li1',
      status: 'cancelled',
      reservedAt: d('2024-03-15T00:00:00Z'),
      cancelledAt: d('2024-03-16T00:00:00Z'),
      transferFromInstanceId: null,
      transferToInstanceId: null,
      waitlistPosition: null,
      notes: '',
      createdAt: d('2024-03-15T00:00:00Z'),
      updatedAt: d('2024-03-16T00:00:00Z'),
    };
    const result = toReservation(row as never);
    expect(result.cancelledAt).toBe('2024-03-16T00:00:00.000Z');
  });
});

describe('toLessonRecord', () => {
  it('maps memberNotes array', () => {
    const row = {
      id: 'lr1',
      lessonInstanceId: 'li1',
      theme: 'Forehand',
      content: 'Practice',
      memberNotes: [
        {
          memberId: 'm1',
          attendance: 'present',
          performanceRating: 4,
          goodPoints: 'Good',
          improvementPoints: 'Backhand',
          memo: '',
        },
      ],
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toLessonRecord(row as never);
    expect(result.memberNotes).toHaveLength(1);
    expect(result.memberNotes[0].attendance).toBe('present');
  });
});

describe('toNotification', () => {
  it('maps nullable relatedId', () => {
    const row = {
      id: 'n1',
      memberId: 'm1',
      type: 'general',
      title: 'Title',
      message: 'Msg',
      isRead: false,
      relatedId: null,
      createdAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toNotification(row as never);
    expect(result.relatedId).toBeNull();
  });
});

describe('toTicketType', () => {
  it('maps all fields', () => {
    const row = {
      id: 'tt1',
      name: '10回券',
      description: '10回分のチケット',
      lessonCount: 10,
      validDays: 90,
      price: 15000,
      isActive: true,
      createdAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toTicketType(row as never);
    expect(result.lessonCount).toBe(10);
    expect(result.validDays).toBe(90);
  });
});

describe('toMemberTicket', () => {
  it('converts date fields to ISO strings', () => {
    const row = {
      id: 'mt1',
      memberId: 'm1',
      ticketTypeId: 'tt1',
      remainingCount: 5,
      purchasedAt: d('2024-01-01T00:00:00Z'),
      expiresAt: d('2024-04-01T00:00:00Z'),
      isActive: true,
    };
    const result = toMemberTicket(row as never);
    expect(result.purchasedAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.expiresAt).toBe('2024-04-01T00:00:00.000Z');
  });
});

describe('toTicketUsage', () => {
  it('converts usedAt to ISO string', () => {
    const row = {
      id: 'tu1',
      memberTicketId: 'mt1',
      reservationId: 'r1',
      usedAt: d('2024-01-15T10:00:00Z'),
    };
    const result = toTicketUsage(row as never);
    expect(result.usedAt).toBe('2024-01-15T10:00:00.000Z');
  });
});

describe('toTrialApplication', () => {
  it('maps nullable reviewedAt', () => {
    const row = {
      id: 'ta1',
      name: '佐藤',
      nameKana: 'サトウ',
      email: 'sato@test.com',
      phone: '090-0000-0000',
      preferredLevel: 'beginner',
      preferredDate: '2024-03-15',
      preferredTime: '10:00',
      message: 'よろしくお願いします',
      status: 'pending',
      adminNotes: '',
      reviewedAt: null,
      createdAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toTrialApplication(row as never);
    expect(result.reviewedAt).toBeNull();
    expect(result.status).toBe('pending');
  });
});

describe('toEvent', () => {
  it('maps nullable courtId and targetLevel', () => {
    const row = {
      id: 'e1',
      title: 'Tournament',
      description: 'Desc',
      eventDate: '2024-06-01',
      startTime: '09:00',
      endTime: '17:00',
      courtId: null,
      maxParticipants: 32,
      targetLevel: null,
      fee: 5000,
      isPublished: true,
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toEvent(row as never);
    expect(result.courtId).toBeNull();
    expect(result.targetLevel).toBeNull();
  });
});

describe('toEventRegistration', () => {
  it('maps nullable cancelledAt', () => {
    const row = {
      id: 'er1',
      eventId: 'e1',
      memberId: 'm1',
      status: 'registered',
      registeredAt: d('2024-01-01T00:00:00Z'),
      cancelledAt: null,
      notes: '',
    };
    const result = toEventRegistration(row as never);
    expect(result.cancelledAt).toBeNull();
    expect(result.registeredAt).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('toChatMessage', () => {
  it('maps all fields', () => {
    const row = {
      id: 'cm1',
      senderId: 'm1',
      senderRole: 'member',
      receiverId: 'admin',
      message: 'Hello',
      isRead: false,
      createdAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toChatMessage(row as never);
    expect(result.senderRole).toBe('member');
    expect(result.isRead).toBe(false);
  });
});

describe('toProduct', () => {
  it('maps nullable fields to null', () => {
    const row = {
      id: 'p1',
      name: 'Racket',
      description: 'Good racket',
      category: 'racket',
      price: 25000,
      stock: 10,
      sku: null,
      barcode: null,
      imageUrl: null,
      isActive: true,
      displayOrder: 0,
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toProduct(row as never);
    expect(result.sku).toBeNull();
    expect(result.barcode).toBeNull();
    expect(result.imageUrl).toBeNull();
  });
});

describe('toShopOrder', () => {
  it('maps all fields with nullable posTransactionId', () => {
    const row = {
      id: 'so1',
      memberId: 'm1',
      orderNumber: 'ORD-20240101-0001',
      status: 'pending',
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      subtotal: 10000,
      tax: 1000,
      totalAmount: 11000,
      notes: '',
      orderSource: 'online',
      posTransactionId: null,
      createdAt: d('2024-01-01T00:00:00Z'),
      updatedAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toShopOrder(row as never);
    expect(result.posTransactionId).toBeNull();
    expect(result.totalAmount).toBe(11000);
  });
});

describe('toShopOrderItem', () => {
  it('maps all fields', () => {
    const row = {
      id: 'soi1',
      orderId: 'so1',
      productId: 'p1',
      productName: 'Racket',
      unitPrice: 25000,
      quantity: 1,
      subtotal: 25000,
      createdAt: d('2024-01-01T00:00:00Z'),
    };
    const result = toShopOrderItem(row as never);
    expect(result.productName).toBe('Racket');
    expect(result.subtotal).toBe(25000);
  });
});
