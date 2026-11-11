import { pgTable, index, uuid, varchar, timestamp, integer, unique, jsonb, boolean, foreignKey, date, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const attendanceStatus = pgEnum("attendance_status", ['present', 'absent', 'late', 'excused'])
export const courtSurface = pgEnum("court_surface", ['hard', 'clay', 'omni', 'carpet'])
export const courtType = pgEnum("court_type", ['indoor', 'outdoor'])
export const eventRegistrationStatus = pgEnum("event_registration_status", ['registered', 'cancelled', 'waitlisted'])
export const lessonLevel = pgEnum("lesson_level", ['beginner', 'intermediate', 'advanced', 'junior'])
export const membershipType = pgEnum("membership_type", ['regular', 'student', 'senior', 'family', 'trial'])
export const notificationType = pgEnum("notification_type", ['lesson_cancel', 'reservation_confirm', 'reservation_cancel', 'waitlist_promoted', 'transfer_complete', 'event_new', 'trial_approved', 'ticket_expiring', 'general'])
export const recurrenceType = pgEnum("recurrence_type", ['none', 'weekly', 'biweekly', 'monthly'])
export const reservationStatus = pgEnum("reservation_status", ['confirmed', 'cancelled', 'waitlisted', 'transferred'])
export const senderRole = pgEnum("sender_role", ['member', 'admin'])
export const trialStatus = pgEnum("trial_status", ['pending', 'approved', 'rejected', 'completed', 'no_show'])


export const emailVerifications = pgTable("email_verifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 6 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameKana: varchar("name_kana", { length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	attempts: integer().default(0).notNull(),
}, (table) => [
	index("idx_email_verifications_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const coaches = pgTable("coaches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameKana: varchar("name_kana", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	specialties: jsonb().notNull(),
	bio: varchar({ length: 2000 }).default(').notNull(),
	certifications: jsonb().notNull(),
	avatarColor: varchar("avatar_color", { length: 20 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("coaches_email_unique").on(table.email),
]);

export const courts = pgTable("courts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: courtType().notNull(),
	surface: courtSurface().notNull(),
	capacity: integer().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
});

export const lessonRecords = pgTable("lesson_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lessonInstanceId: uuid("lesson_instance_id").notNull(),
	theme: varchar({ length: 500 }).notNull(),
	content: varchar({ length: 5000 }).notNull(),
	memberNotes: jsonb("member_notes").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.lessonInstanceId],
			foreignColumns: [lessonInstances.id],
			name: "lesson_records_lesson_instance_id_lesson_instances_id_fk"
		}),
	unique("lesson_records_lesson_instance_id_unique").on(table.lessonInstanceId),
]);

export const reservations = pgTable("reservations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memberId: uuid("member_id").notNull(),
	lessonInstanceId: uuid("lesson_instance_id").notNull(),
	status: reservationStatus().default('confirmed').notNull(),
	reservedAt: timestamp("reserved_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	transferFromInstanceId: uuid("transfer_from_instance_id"),
	transferToInstanceId: uuid("transfer_to_instance_id"),
	waitlistPosition: integer("waitlist_position"),
	notes: varchar({ length: 2000 }).default(').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_reservations_lesson_instance_id").using("btree", table.lessonInstanceId.asc().nullsLast().op("uuid_ops")),
	index("idx_reservations_member_id").using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
	index("idx_reservations_member_status").using("btree", table.memberId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "reservations_member_id_members_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lessonInstanceId],
			foreignColumns: [lessonInstances.id],
			name: "reservations_lesson_instance_id_lesson_instances_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.transferFromInstanceId],
			foreignColumns: [lessonInstances.id],
			name: "reservations_transfer_from_instance_id_lesson_instances_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.transferToInstanceId],
			foreignColumns: [lessonInstances.id],
			name: "reservations_transfer_to_instance_id_lesson_instances_id_fk"
		}).onDelete("set null"),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	senderId: varchar("sender_id", { length: 255 }).notNull(),
	senderRole: senderRole("sender_role").notNull(),
	receiverId: varchar("receiver_id", { length: 255 }).notNull(),
	message: varchar({ length: 5000 }).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_chat_messages_receiver").using("btree", table.receiverId.asc().nullsLast().op("text_ops")),
	index("idx_chat_messages_sender").using("btree", table.senderId.asc().nullsLast().op("text_ops")),
	index("idx_chat_messages_sender_receiver").using("btree", table.senderId.asc().nullsLast().op("text_ops"), table.receiverId.asc().nullsLast().op("text_ops")),
]);

export const members = pgTable("members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameKana: varchar("name_kana", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	level: lessonLevel().notNull(),
	membershipType: membershipType("membership_type").notNull(),
	joinDate: date("join_date").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	notes: varchar({ length: 2000 }).default(').notNull(),
	password: varchar({ length: 255 }).notNull(),
	avatarColor: varchar("avatar_color", { length: 20 }).notNull(),
	remainingTransfers: integer("remaining_transfers").default(3).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("members_email_unique").on(table.email),
]);

export const lessonSlots = pgTable("lesson_slots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	level: lessonLevel().notNull(),
	coachId: uuid("coach_id").notNull(),
	courtId: uuid("court_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: varchar("start_time", { length: 5 }).notNull(),
	endTime: varchar("end_time", { length: 5 }).notNull(),
	maxCapacity: integer("max_capacity").notNull(),
	isRecurring: boolean("is_recurring").default(true).notNull(),
	recurrenceType: recurrenceType("recurrence_type").default('weekly').notNull(),
	recurrenceStartDate: date("recurrence_start_date").notNull(),
	recurrenceEndDate: date("recurrence_end_date"),
	specificDate: date("specific_date"),
	monthlyWeekNumber: integer("monthly_week_number"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_lesson_slots_coach_id").using("btree", table.coachId.asc().nullsLast().op("uuid_ops")),
	index("idx_lesson_slots_court_id").using("btree", table.courtId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [coaches.id],
			name: "lesson_slots_coach_id_coaches_id_fk"
		}),
	foreignKey({
			columns: [table.courtId],
			foreignColumns: [courts.id],
			name: "lesson_slots_court_id_courts_id_fk"
		}),
]);

export const lessonInstances = pgTable("lesson_instances", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lessonSlotId: uuid("lesson_slot_id").notNull(),
	date: date().notNull(),
	coachId: uuid("coach_id").notNull(),
	courtId: uuid("court_id").notNull(),
	startTime: varchar("start_time", { length: 5 }).notNull(),
	endTime: varchar("end_time", { length: 5 }).notNull(),
	maxCapacity: integer("max_capacity").notNull(),
	isCancelled: boolean("is_cancelled").default(false).notNull(),
	cancelReason: varchar("cancel_reason", { length: 500 }).default(').notNull(),
	notes: varchar({ length: 2000 }).default(').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_lesson_instances_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_lesson_instances_date_cancelled").using("btree", table.date.asc().nullsLast().op("date_ops"), table.isCancelled.asc().nullsLast().op("bool_ops")),
	index("idx_lesson_instances_lesson_slot_id").using("btree", table.lessonSlotId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("idx_lesson_instances_slot_date").using("btree", table.lessonSlotId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.lessonSlotId],
			foreignColumns: [lessonSlots.id],
			name: "lesson_instances_lesson_slot_id_lesson_slots_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.coachId],
			foreignColumns: [coaches.id],
			name: "lesson_instances_coach_id_coaches_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.courtId],
			foreignColumns: [courts.id],
			name: "lesson_instances_court_id_courts_id_fk"
		}).onDelete("restrict"),
]);

export const memberTickets = pgTable("member_tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memberId: uuid("member_id").notNull(),
	ticketTypeId: uuid("ticket_type_id").notNull(),
	remainingCount: integer("remaining_count").notNull(),
	purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	index("idx_member_tickets_member_id").using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ticketTypeId],
			foreignColumns: [ticketTypes.id],
			name: "member_tickets_ticket_type_id_ticket_types_id_fk"
		}),
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "member_tickets_member_id_members_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memberId: uuid("member_id").notNull(),
	type: notificationType().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: varchar({ length: 2000 }).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	relatedId: varchar("related_id", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notifications_member_id").using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
	index("idx_notifications_member_read").using("btree", table.memberId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "notifications_member_id_members_id_fk"
		}).onDelete("cascade"),
]);

export const ticketUsages = pgTable("ticket_usages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memberTicketId: uuid("member_ticket_id").notNull(),
	reservationId: uuid("reservation_id").notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ticket_usages_member_ticket_id").using("btree", table.memberTicketId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.memberTicketId],
			foreignColumns: [memberTickets.id],
			name: "ticket_usages_member_ticket_id_member_tickets_id_fk"
		}),
	foreignKey({
			columns: [table.reservationId],
			foreignColumns: [reservations.id],
			name: "ticket_usages_reservation_id_reservations_id_fk"
		}),
]);

export const ticketTypes = pgTable("ticket_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 2000 }).default(').notNull(),
	lessonCount: integer("lesson_count").notNull(),
	validDays: integer("valid_days").notNull(),
	price: integer().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const eventRegistrations = pgTable("event_registrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	memberId: uuid("member_id").notNull(),
	status: eventRegistrationStatus().default('registered').notNull(),
	registeredAt: timestamp("registered_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	notes: varchar({ length: 2000 }).default(').notNull(),
}, (table) => [
	index("idx_event_registrations_event_id").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("idx_event_registrations_member_id").using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_registrations_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "event_registrations_member_id_members_id_fk"
		}).onDelete("cascade"),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 5000 }).notNull(),
	eventDate: date("event_date").notNull(),
	startTime: varchar("start_time", { length: 5 }).notNull(),
	endTime: varchar("end_time", { length: 5 }).notNull(),
	courtId: uuid("court_id"),
	maxParticipants: integer("max_participants").notNull(),
	targetLevel: lessonLevel("target_level"),
	fee: integer().default(0).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.courtId],
			foreignColumns: [courts.id],
			name: "events_court_id_courts_id_fk"
		}),
]);

export const trialApplications = pgTable("trial_applications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameKana: varchar("name_kana", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	preferredLevel: lessonLevel("preferred_level").notNull(),
	preferredDate: date("preferred_date").notNull(),
	preferredTime: varchar("preferred_time", { length: 5 }).notNull(),
	message: varchar({ length: 2000 }).default(').notNull(),
	status: trialStatus().default('pending').notNull(),
	adminNotes: varchar("admin_notes", { length: 2000 }).default(').notNull(),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});
