import type {
  Member,
  Coach,
  Court,
  LessonSlot,
  LessonInstance,
  Reservation,
  LessonRecord,
  MemberLessonNote,
  DayOfWeek,
  LessonLevel,
  MembershipType,
  CourtType,
  CourtSurface,
  RecurrenceType,
  ReservationStatus,
  AttendanceStatus,
  Notification,
  NotificationType,
  TicketType,
  MemberTicket,
  TicketUsage,
  TrialApplication,
  TrialStatus,
  Event,
  EventRegistration,
  EventRegistrationStatus,
  ChatMessage,
  SenderRole,
  FamilyGroup,
  FamilyGroupMember,
  FamilyRelationship,
} from '@/domain/models';
import type {
  members, coaches, courts, lessonSlots, lessonInstances, reservations, lessonRecords,
  notifications, ticketTypes, memberTickets, ticketUsages, trialApplications,
  events, eventRegistrations, chatMessages, familyGroups, familyGroupMembers,
} from './schema';

type MemberRow = typeof members.$inferSelect;
type CoachRow = typeof coaches.$inferSelect;
type CourtRow = typeof courts.$inferSelect;
type LessonSlotRow = typeof lessonSlots.$inferSelect;
type LessonInstanceRow = typeof lessonInstances.$inferSelect;
type ReservationRow = typeof reservations.$inferSelect;
type LessonRecordRow = typeof lessonRecords.$inferSelect;

export function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    nameKana: row.nameKana,
    email: row.email,
    phone: row.phone,
    level: row.level as LessonLevel,
    membershipType: row.membershipType as MembershipType,
    joinDate: row.joinDate,
    isActive: row.isActive,
    notes: row.notes,
    password: row.password,
    avatarColor: row.avatarColor,
    remainingTransfers: row.remainingTransfers,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCoach(row: CoachRow): Coach {
  return {
    id: row.id,
    name: row.name,
    nameKana: row.nameKana,
    email: row.email,
    phone: row.phone,
    specialties: row.specialties as LessonLevel[],
    bio: row.bio,
    certifications: row.certifications as string[],
    avatarColor: row.avatarColor,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCourt(row: CourtRow): Court {
  return {
    id: row.id,
    name: row.name,
    type: row.type as CourtType,
    surface: row.surface as CourtSurface,
    capacity: row.capacity,
    isActive: row.isActive,
  };
}

export function toLessonSlot(row: LessonSlotRow): LessonSlot {
  return {
    id: row.id,
    title: row.title,
    level: row.level as LessonLevel,
    coachId: row.coachId,
    courtId: row.courtId,
    dayOfWeek: row.dayOfWeek as DayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    maxCapacity: row.maxCapacity,
    isRecurring: row.isRecurring,
    recurrenceType: row.recurrenceType as RecurrenceType,
    recurrenceStartDate: row.recurrenceStartDate,
    recurrenceEndDate: row.recurrenceEndDate ?? null,
    specificDate: row.specificDate ?? null,
    monthlyWeekNumber: row.monthlyWeekNumber ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toLessonInstance(row: LessonInstanceRow): LessonInstance {
  return {
    id: row.id,
    lessonSlotId: row.lessonSlotId,
    date: row.date,
    coachId: row.coachId,
    courtId: row.courtId,
    startTime: row.startTime,
    endTime: row.endTime,
    maxCapacity: row.maxCapacity,
    isCancelled: row.isCancelled,
    cancelReason: row.cancelReason,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    memberId: row.memberId,
    lessonInstanceId: row.lessonInstanceId,
    status: row.status as ReservationStatus,
    reservedAt: row.reservedAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    transferFromInstanceId: row.transferFromInstanceId ?? null,
    transferToInstanceId: row.transferToInstanceId ?? null,
    waitlistPosition: row.waitlistPosition ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toLessonRecord(row: LessonRecordRow): LessonRecord {
  return {
    id: row.id,
    lessonInstanceId: row.lessonInstanceId,
    theme: row.theme,
    content: row.content,
    memberNotes: (row.memberNotes as MemberLessonNote[]).map((n) => ({
      memberId: n.memberId,
      attendance: n.attendance as AttendanceStatus,
      performanceRating: n.performanceRating,
      goodPoints: n.goodPoints,
      improvementPoints: n.improvementPoints,
      memo: n.memo,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ── New feature mappers ───────────────────────────────

type NotificationRow = typeof notifications.$inferSelect;
type TicketTypeRow = typeof ticketTypes.$inferSelect;
type MemberTicketRow = typeof memberTickets.$inferSelect;
type TicketUsageRow = typeof ticketUsages.$inferSelect;
type TrialApplicationRow = typeof trialApplications.$inferSelect;
type EventRow = typeof events.$inferSelect;
type EventRegistrationRow = typeof eventRegistrations.$inferSelect;
type ChatMessageRow = typeof chatMessages.$inferSelect;
type FamilyGroupRow = typeof familyGroups.$inferSelect;
type FamilyGroupMemberRow = typeof familyGroupMembers.$inferSelect;

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    memberId: row.memberId,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    relatedId: row.relatedId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toTicketType(row: TicketTypeRow): TicketType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    lessonCount: row.lessonCount,
    validDays: row.validDays,
    price: row.price,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toMemberTicket(row: MemberTicketRow): MemberTicket {
  return {
    id: row.id,
    memberId: row.memberId,
    ticketTypeId: row.ticketTypeId,
    remainingCount: row.remainingCount,
    purchasedAt: row.purchasedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    isActive: row.isActive,
  };
}

export function toTicketUsage(row: TicketUsageRow): TicketUsage {
  return {
    id: row.id,
    memberTicketId: row.memberTicketId,
    reservationId: row.reservationId,
    usedAt: row.usedAt.toISOString(),
  };
}

export function toTrialApplication(row: TrialApplicationRow): TrialApplication {
  return {
    id: row.id,
    name: row.name,
    nameKana: row.nameKana,
    email: row.email,
    phone: row.phone,
    preferredLevel: row.preferredLevel as LessonLevel,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    message: row.message,
    status: row.status as TrialStatus,
    adminNotes: row.adminNotes,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.eventDate,
    startTime: row.startTime,
    endTime: row.endTime,
    courtId: row.courtId ?? null,
    maxParticipants: row.maxParticipants,
    targetLevel: (row.targetLevel as LessonLevel) ?? null,
    fee: row.fee,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toEventRegistration(row: EventRegistrationRow): EventRegistration {
  return {
    id: row.id,
    eventId: row.eventId,
    memberId: row.memberId,
    status: row.status as EventRegistrationStatus,
    registeredAt: row.registeredAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    notes: row.notes,
  };
}

export function toChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    senderRole: row.senderRole as SenderRole,
    receiverId: row.receiverId,
    message: row.message,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFamilyGroup(row: FamilyGroupRow): FamilyGroup {
  return {
    id: row.id,
    name: row.name,
    primaryMemberId: row.primaryMemberId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFamilyGroupMember(row: FamilyGroupMemberRow): FamilyGroupMember {
  return {
    id: row.id,
    familyGroupId: row.familyGroupId,
    memberId: row.memberId,
    relationship: row.relationship as FamilyRelationship,
    joinedAt: row.joinedAt.toISOString(),
  };
}
