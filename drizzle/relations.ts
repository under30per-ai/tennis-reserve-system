import { relations } from "drizzle-orm/relations";
import { lessonInstances, lessonRecords, members, reservations, coaches, lessonSlots, courts, ticketTypes, memberTickets, notifications, ticketUsages, events, eventRegistrations } from "./schema";

export const lessonRecordsRelations = relations(lessonRecords, ({one}) => ({
	lessonInstance: one(lessonInstances, {
		fields: [lessonRecords.lessonInstanceId],
		references: [lessonInstances.id]
	}),
}));

export const lessonInstancesRelations = relations(lessonInstances, ({one, many}) => ({
	lessonRecords: many(lessonRecords),
	reservations_lessonInstanceId: many(reservations, {
		relationName: "reservations_lessonInstanceId_lessonInstances_id"
	}),
	reservations_transferFromInstanceId: many(reservations, {
		relationName: "reservations_transferFromInstanceId_lessonInstances_id"
	}),
	reservations_transferToInstanceId: many(reservations, {
		relationName: "reservations_transferToInstanceId_lessonInstances_id"
	}),
	lessonSlot: one(lessonSlots, {
		fields: [lessonInstances.lessonSlotId],
		references: [lessonSlots.id]
	}),
	coach: one(coaches, {
		fields: [lessonInstances.coachId],
		references: [coaches.id]
	}),
	court: one(courts, {
		fields: [lessonInstances.courtId],
		references: [courts.id]
	}),
}));

export const reservationsRelations = relations(reservations, ({one, many}) => ({
	member: one(members, {
		fields: [reservations.memberId],
		references: [members.id]
	}),
	lessonInstance_lessonInstanceId: one(lessonInstances, {
		fields: [reservations.lessonInstanceId],
		references: [lessonInstances.id],
		relationName: "reservations_lessonInstanceId_lessonInstances_id"
	}),
	lessonInstance_transferFromInstanceId: one(lessonInstances, {
		fields: [reservations.transferFromInstanceId],
		references: [lessonInstances.id],
		relationName: "reservations_transferFromInstanceId_lessonInstances_id"
	}),
	lessonInstance_transferToInstanceId: one(lessonInstances, {
		fields: [reservations.transferToInstanceId],
		references: [lessonInstances.id],
		relationName: "reservations_transferToInstanceId_lessonInstances_id"
	}),
	ticketUsages: many(ticketUsages),
}));

export const membersRelations = relations(members, ({many}) => ({
	reservations: many(reservations),
	memberTickets: many(memberTickets),
	notifications: many(notifications),
	eventRegistrations: many(eventRegistrations),
}));

export const lessonSlotsRelations = relations(lessonSlots, ({one, many}) => ({
	coach: one(coaches, {
		fields: [lessonSlots.coachId],
		references: [coaches.id]
	}),
	court: one(courts, {
		fields: [lessonSlots.courtId],
		references: [courts.id]
	}),
	lessonInstances: many(lessonInstances),
}));

export const coachesRelations = relations(coaches, ({many}) => ({
	lessonSlots: many(lessonSlots),
	lessonInstances: many(lessonInstances),
}));

export const courtsRelations = relations(courts, ({many}) => ({
	lessonSlots: many(lessonSlots),
	lessonInstances: many(lessonInstances),
	events: many(events),
}));

export const memberTicketsRelations = relations(memberTickets, ({one, many}) => ({
	ticketType: one(ticketTypes, {
		fields: [memberTickets.ticketTypeId],
		references: [ticketTypes.id]
	}),
	member: one(members, {
		fields: [memberTickets.memberId],
		references: [members.id]
	}),
	ticketUsages: many(ticketUsages),
}));

export const ticketTypesRelations = relations(ticketTypes, ({many}) => ({
	memberTickets: many(memberTickets),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	member: one(members, {
		fields: [notifications.memberId],
		references: [members.id]
	}),
}));

export const ticketUsagesRelations = relations(ticketUsages, ({one}) => ({
	memberTicket: one(memberTickets, {
		fields: [ticketUsages.memberTicketId],
		references: [memberTickets.id]
	}),
	reservation: one(reservations, {
		fields: [ticketUsages.reservationId],
		references: [reservations.id]
	}),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({one}) => ({
	event: one(events, {
		fields: [eventRegistrations.eventId],
		references: [events.id]
	}),
	member: one(members, {
		fields: [eventRegistrations.memberId],
		references: [members.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	eventRegistrations: many(eventRegistrations),
	court: one(courts, {
		fields: [events.courtId],
		references: [courts.id]
	}),
}));