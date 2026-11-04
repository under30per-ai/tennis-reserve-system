CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused');--> statement-breakpoint
CREATE TYPE "public"."court_surface" AS ENUM('hard', 'clay', 'omni', 'carpet');--> statement-breakpoint
CREATE TYPE "public"."court_type" AS ENUM('indoor', 'outdoor');--> statement-breakpoint
CREATE TYPE "public"."lesson_level" AS ENUM('beginner', 'intermediate', 'advanced', 'junior');--> statement-breakpoint
CREATE TYPE "public"."membership_type" AS ENUM('regular', 'student', 'senior', 'family', 'trial');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('none', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('confirmed', 'cancelled', 'waitlisted', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_kana" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"specialties" jsonb NOT NULL,
	"bio" varchar(2000) DEFAULT '' NOT NULL,
	"certifications" jsonb NOT NULL,
	"avatar_color" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coaches_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "courts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "court_type" NOT NULL,
	"surface" "court_surface" NOT NULL,
	"capacity" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_kana" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_slot_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"coach_id" uuid NOT NULL,
	"court_id" uuid NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"max_capacity" integer NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"cancel_reason" varchar(500) DEFAULT '' NOT NULL,
	"notes" varchar(2000) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_instance_id" uuid NOT NULL,
	"theme" varchar(500) NOT NULL,
	"content" varchar(5000) NOT NULL,
	"member_notes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_records_lesson_instance_id_unique" UNIQUE("lesson_instance_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"level" "lesson_level" NOT NULL,
	"coach_id" uuid NOT NULL,
	"court_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"max_capacity" integer NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"recurrence_type" "recurrence_type" DEFAULT 'weekly' NOT NULL,
	"recurrence_start_date" varchar(10) NOT NULL,
	"recurrence_end_date" varchar(10),
	"specific_date" varchar(10),
	"monthly_week_number" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_kana" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"level" "lesson_level" NOT NULL,
	"membership_type" "membership_type" NOT NULL,
	"join_date" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" varchar(2000) DEFAULT '' NOT NULL,
	"password" varchar(255) NOT NULL,
	"avatar_color" varchar(20) NOT NULL,
	"remaining_transfers" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"lesson_instance_id" uuid NOT NULL,
	"status" "reservation_status" DEFAULT 'confirmed' NOT NULL,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"transfer_from_instance_id" uuid,
	"transfer_to_instance_id" uuid,
	"waitlist_position" integer,
	"notes" varchar(2000) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_instances" ADD CONSTRAINT "lesson_instances_lesson_slot_id_lesson_slots_id_fk" FOREIGN KEY ("lesson_slot_id") REFERENCES "public"."lesson_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_instances" ADD CONSTRAINT "lesson_instances_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_instances" ADD CONSTRAINT "lesson_instances_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_records" ADD CONSTRAINT "lesson_records_lesson_instance_id_lesson_instances_id_fk" FOREIGN KEY ("lesson_instance_id") REFERENCES "public"."lesson_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_slots" ADD CONSTRAINT "lesson_slots_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_slots" ADD CONSTRAINT "lesson_slots_court_id_courts_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."courts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_lesson_instance_id_lesson_instances_id_fk" FOREIGN KEY ("lesson_instance_id") REFERENCES "public"."lesson_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lesson_instances_date" ON "lesson_instances" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_lesson_instances_date_cancelled" ON "lesson_instances" USING btree ("date","is_cancelled");--> statement-breakpoint
CREATE INDEX "idx_lesson_instances_lesson_slot_id" ON "lesson_instances" USING btree ("lesson_slot_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_lesson_instance_id" ON "reservations" USING btree ("lesson_instance_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_member_id" ON "reservations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_member_status" ON "reservations" USING btree ("member_id","status");