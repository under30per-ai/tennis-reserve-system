CREATE TYPE "public"."event_registration_status" AS ENUM('registered', 'cancelled', 'waitlisted');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('lesson_cancel', 'reservation_confirm', 'reservation_cancel', 'waitlist_promoted', 'transfer_complete', 'event_new', 'trial_approved', 'ticket_expiring', 'general');--> statement-breakpoint
CREATE TYPE "public"."sender_role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('pending', 'approved', 'rejected', 'completed', 'no_show');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"sender_role" "sender_role" NOT NULL,
	"receiver_id" varchar(255) NOT NULL,
	"message" varchar(5000) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" "event_registration_status" DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"notes" varchar(2000) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(5000) NOT NULL,
	"event_date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"court_id" uuid,
	"max_participants" integer NOT NULL,
	"target_level" "lesson_level",
	"fee" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"remaining_count" integer NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" varchar(2000) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(2000) DEFAULT '' NOT NULL,
	"lesson_count" integer NOT NULL,
	"valid_days" integer NOT NULL,
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_ticket_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trial_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_kana" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"preferred_level" "lesson_level" NOT NULL,
	"preferred_date" date NOT NULL,
	"preferred_time" varchar(5) NOT NULL,
	"message" varchar(2000) DEFAULT '' NOT NULL,
	"status" "trial_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" varchar(2000) DEFAULT '' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_instances" DROP CONSTRAINT "lesson_instances_lesson_slot_id_lesson_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_instances" DROP CONSTRAINT "lesson_instances_coach_id_coaches_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_instances" DROP CONSTRAINT "lesson_instances_court_id_courts_id_fk";
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_lesson_instance_id_lesson_instances_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_instances" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "lesson_slots" ALTER COLUMN "recurrence_start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "lesson_slots" ALTER COLUMN "recurrence_end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "lesson_slots" ALTER COLUMN "specific_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "join_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tickets" ADD CONSTRAINT "member_tickets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tickets" ADD CONSTRAINT "member_tickets_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_usages" ADD CONSTRAINT "ticket_usages_member_ticket_id_member_tickets_id_fk" FOREIGN KEY ("member_ticket_id") REFERENCES "public"."member_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_usages" ADD CONSTRAINT "ticket_usages_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_messages_sender" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_receiver" ON "chat_messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_sender_receiver" ON "chat_messages" USING btree ("sender_id","receiver_id");--> statement-breakpoint
CREATE INDEX "idx_event_registrations_event_id" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_registrations_member_id" ON "event_registrations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_tickets_member_id" ON "member_tickets" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_member_id" ON "notifications" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_member_read" ON "notifications" USING btree ("member_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_ticket_usages_member_ticket_id" ON "ticket_usages" USING btree ("member_ticket_id");--> statement-breakpoint
ALTER TABLE "lesson_instances" ADD CONSTRAINT "lesson_instances_lesson_slot_id_lesson_slots_id_fk" FOREIGN KEY ("lesson_slot_id") REFERENCES "public"."lesson_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_instances" ADD CONSTRAINT "lesson_instances_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_instances" ADD CONSTRAINT "lesson_instances_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_transfer_from_instance_id_lesson_instances_id_fk" FOREIGN KEY ("transfer_from_instance_id") REFERENCES "public"."lesson_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_transfer_to_instance_id_lesson_instances_id_fk" FOREIGN KEY ("transfer_to_instance_id") REFERENCES "public"."lesson_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_lesson_instance_id_lesson_instances_id_fk" FOREIGN KEY ("lesson_instance_id") REFERENCES "public"."lesson_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_verifications_email" ON "email_verifications" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lesson_instances_slot_date" ON "lesson_instances" USING btree ("lesson_slot_id","date");--> statement-breakpoint
CREATE INDEX "idx_lesson_slots_coach_id" ON "lesson_slots" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_slots_court_id" ON "lesson_slots" USING btree ("court_id");