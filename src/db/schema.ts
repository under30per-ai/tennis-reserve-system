import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────
export const lessonLevelEnum = pgEnum('lesson_level', [
  'beginner',
  'intermediate',
  'advanced',
  'junior',
]);

export const membershipTypeEnum = pgEnum('membership_type', [
  'regular',
  'student',
  'senior',
  'family',
  'trial',
]);

export const reservationStatusEnum = pgEnum('reservation_status', [
  'confirmed',
  'cancelled',
  'waitlisted',
  'transferred',
]);

export const recurrenceTypeEnum = pgEnum('recurrence_type', [
  'none',
  'weekly',
  'biweekly',
  'monthly',
]);

export const courtTypeEnum = pgEnum('court_type', ['indoor', 'outdoor']);

export const courtSurfaceEnum = pgEnum('court_surface', [
  'hard',
  'clay',
  'omni',
  'carpet',
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'late',
  'excused',
]);

export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

// ── Tables ─────────────────────────────────────────────

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nameKana: varchar('name_kana', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }).notNull(),
  level: lessonLevelEnum('level').notNull(),
  membershipType: membershipTypeEnum('membership_type').notNull(),
  joinDate: varchar('join_date', { length: 10 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  notes: varchar('notes', { length: 2000 }).notNull().default(''),
  password: varchar('password', { length: 255 }).notNull(),
  avatarColor: varchar('avatar_color', { length: 20 }).notNull(),
  remainingTransfers: integer('remaining_transfers').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const coaches = pgTable('coaches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nameKana: varchar('name_kana', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }).notNull(),
  specialties: jsonb('specialties').notNull().$type<string[]>(),
  bio: varchar('bio', { length: 2000 }).notNull().default(''),
  certifications: jsonb('certifications').notNull().$type<string[]>(),
  avatarColor: varchar('avatar_color', { length: 20 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: courtTypeEnum('type').notNull(),
  surface: courtSurfaceEnum('surface').notNull(),
  capacity: integer('capacity').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const lessonSlots = pgTable('lesson_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  level: lessonLevelEnum('level').notNull(),
  coachId: uuid('coach_id').notNull().references(() => coaches.id),
  courtId: uuid('court_id').notNull().references(() => courts.id),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  maxCapacity: integer('max_capacity').notNull(),
  isRecurring: boolean('is_recurring').notNull().default(true),
  recurrenceType: recurrenceTypeEnum('recurrence_type').notNull().default('weekly'),
  recurrenceStartDate: varchar('recurrence_start_date', { length: 10 }).notNull(),
  recurrenceEndDate: varchar('recurrence_end_date', { length: 10 }),
  specificDate: varchar('specific_date', { length: 10 }),
  monthlyWeekNumber: integer('monthly_week_number'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lessonInstances = pgTable('lesson_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonSlotId: uuid('lesson_slot_id').notNull().references(() => lessonSlots.id),
  date: varchar('date', { length: 10 }).notNull(),
  coachId: uuid('coach_id').notNull().references(() => coaches.id),
  courtId: uuid('court_id').notNull().references(() => courts.id),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  maxCapacity: integer('max_capacity').notNull(),
  isCancelled: boolean('is_cancelled').notNull().default(false),
  cancelReason: varchar('cancel_reason', { length: 500 }).notNull().default(''),
  notes: varchar('notes', { length: 2000 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_lesson_instances_date').on(table.date),
  index('idx_lesson_instances_date_cancelled').on(table.date, table.isCancelled),
  index('idx_lesson_instances_lesson_slot_id').on(table.lessonSlotId),
]);

export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  lessonInstanceId: uuid('lesson_instance_id').notNull().references(() => lessonInstances.id),
  status: reservationStatusEnum('status').notNull().default('confirmed'),
  reservedAt: timestamp('reserved_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  transferFromInstanceId: uuid('transfer_from_instance_id'),
  transferToInstanceId: uuid('transfer_to_instance_id'),
  waitlistPosition: integer('waitlist_position'),
  notes: varchar('notes', { length: 2000 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_reservations_lesson_instance_id').on(table.lessonInstanceId),
  index('idx_reservations_member_id').on(table.memberId),
  index('idx_reservations_member_status').on(table.memberId, table.status),
]);

export const lessonRecords = pgTable('lesson_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonInstanceId: uuid('lesson_instance_id').notNull().references(() => lessonInstances.id).unique(),
  theme: varchar('theme', { length: 500 }).notNull(),
  content: varchar('content', { length: 5000 }).notNull(),
  memberNotes: jsonb('member_notes').notNull().$type<{
    memberId: string;
    attendance: string;
    performanceRating: number;
    goodPoints: string;
    improvementPoints: string;
    memo: string;
  }[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
