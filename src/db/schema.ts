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
  uniqueIndex,
  date,
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

export const notificationTypeEnum = pgEnum('notification_type', [
  'lesson_cancel',
  'reservation_confirm',
  'reservation_cancel',
  'waitlist_promoted',
  'transfer_complete',
  'event_new',
  'trial_approved',
  'ticket_expiring',
  'general',
]);

export const trialStatusEnum = pgEnum('trial_status', [
  'pending',
  'approved',
  'rejected',
  'completed',
  'no_show',
]);

export const eventRegistrationStatusEnum = pgEnum('event_registration_status', [
  'registered',
  'cancelled',
  'waitlisted',
]);

export const senderRoleEnum = pgEnum('sender_role', ['member', 'admin']);


// ── Tables ─────────────────────────────────────────────

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nameKana: varchar('name_kana', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }).notNull(),
  level: lessonLevelEnum('level').notNull(),
  membershipType: membershipTypeEnum('membership_type').notNull(),
  joinDate: date('join_date', { mode: 'string' }).notNull(),
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
  recurrenceStartDate: date('recurrence_start_date', { mode: 'string' }).notNull(),
  recurrenceEndDate: date('recurrence_end_date', { mode: 'string' }),
  specificDate: date('specific_date', { mode: 'string' }),
  monthlyWeekNumber: integer('monthly_week_number'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_lesson_slots_coach_id').on(table.coachId),
  index('idx_lesson_slots_court_id').on(table.courtId),
]);

export const lessonInstances = pgTable('lesson_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonSlotId: uuid('lesson_slot_id').notNull().references(() => lessonSlots.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  coachId: uuid('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  courtId: uuid('court_id').notNull().references(() => courts.id, { onDelete: 'restrict' }),
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
  uniqueIndex('idx_lesson_instances_slot_date').on(table.lessonSlotId, table.date),
]);

export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  lessonInstanceId: uuid('lesson_instance_id').notNull().references(() => lessonInstances.id, { onDelete: 'cascade' }),
  status: reservationStatusEnum('status').notNull().default('confirmed'),
  reservedAt: timestamp('reserved_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  transferFromInstanceId: uuid('transfer_from_instance_id').references(() => lessonInstances.id, { onDelete: 'set null' }),
  transferToInstanceId: uuid('transfer_to_instance_id').references(() => lessonInstances.id, { onDelete: 'set null' }),
  waitlistPosition: integer('waitlist_position'),
  notes: varchar('notes', { length: 2000 }).notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_reservations_lesson_instance_id').on(table.lessonInstanceId),
  index('idx_reservations_member_id').on(table.memberId),
  index('idx_reservations_member_status').on(table.memberId, table.status),
]);

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  nameKana: varchar('name_kana', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_email_verifications_email').on(table.email),
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

// ── Notifications ─────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: varchar('message', { length: 2000 }).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  relatedId: varchar('related_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_notifications_member_id').on(table.memberId),
  index('idx_notifications_member_read').on(table.memberId, table.isRead),
]);

// ── Tickets ───────────────────────────────────────────

export const ticketTypes = pgTable('ticket_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 2000 }).notNull().default(''),
  lessonCount: integer('lesson_count').notNull(),
  validDays: integer('valid_days').notNull(),
  price: integer('price').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const memberTickets = pgTable('member_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  ticketTypeId: uuid('ticket_type_id').notNull().references(() => ticketTypes.id),
  remainingCount: integer('remaining_count').notNull(),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => [
  index('idx_member_tickets_member_id').on(table.memberId),
]);

export const ticketUsages = pgTable('ticket_usages', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberTicketId: uuid('member_ticket_id').notNull().references(() => memberTickets.id),
  reservationId: uuid('reservation_id').notNull().references(() => reservations.id),
  usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_ticket_usages_member_ticket_id').on(table.memberTicketId),
]);

// ── Trial Lessons ─────────────────────────────────────

export const trialApplications = pgTable('trial_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nameKana: varchar('name_kana', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  preferredLevel: lessonLevelEnum('preferred_level').notNull(),
  preferredDate: date('preferred_date', { mode: 'string' }).notNull(),
  preferredTime: varchar('preferred_time', { length: 5 }).notNull(),
  message: varchar('message', { length: 2000 }).notNull().default(''),
  status: trialStatusEnum('status').notNull().default('pending'),
  adminNotes: varchar('admin_notes', { length: 2000 }).notNull().default(''),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Events ────────────────────────────────────────────

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 5000 }).notNull(),
  eventDate: date('event_date', { mode: 'string' }).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  courtId: uuid('court_id').references(() => courts.id),
  maxParticipants: integer('max_participants').notNull(),
  targetLevel: lessonLevelEnum('target_level'),
  fee: integer('fee').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  status: eventRegistrationStatusEnum('status').notNull().default('registered'),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  notes: varchar('notes', { length: 2000 }).notNull().default(''),
}, (table) => [
  index('idx_event_registrations_event_id').on(table.eventId),
  index('idx_event_registrations_member_id').on(table.memberId),
]);

// ── Chat ──────────────────────────────────────────────

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: varchar('sender_id', { length: 255 }).notNull(),
  senderRole: senderRoleEnum('sender_role').notNull(),
  receiverId: varchar('receiver_id', { length: 255 }).notNull(),
  message: varchar('message', { length: 5000 }).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_chat_messages_sender').on(table.senderId),
  index('idx_chat_messages_receiver').on(table.receiverId),
  index('idx_chat_messages_sender_receiver').on(table.senderId, table.receiverId),
]);

