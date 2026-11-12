CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_rate_limits_lookup" ON "rate_limits" USING btree ("identifier","action");--> statement-breakpoint
CREATE INDEX "idx_rate_limits_expires" ON "rate_limits" USING btree ("expires_at");