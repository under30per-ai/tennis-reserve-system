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
} from '@/domain/models';
import type { members, coaches, courts, lessonSlots, lessonInstances, reservations, lessonRecords } from './schema';

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
