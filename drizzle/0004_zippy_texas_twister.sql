CREATE TYPE "public"."order_source" AS ENUM('online', 'pos');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'credit_card', 'transfer', 'mock');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('racket', 'shoe', 'apparel', 'ball', 'accessory', 'string');--> statement-breakpoint
CREATE TYPE "public"."shop_order_status" AS ENUM('pending', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(5000) DEFAULT '' NOT NULL,
	"category" "product_category" NOT NULL,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"sku" varchar(100),
	"barcode" varchar(100),
	"image_url" varchar(2000),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"status" "shop_order_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'mock' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"subtotal" integer NOT NULL,
	"tax" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"notes" varchar(2000) DEFAULT '' NOT NULL,
	"order_source" "order_source" DEFAULT 'online' NOT NULL,
	"pos_transaction_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "shop_order_items" ADD CONSTRAINT "shop_order_items_order_id_shop_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."shop_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_order_items" ADD CONSTRAINT "shop_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_sku" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_products_is_active" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_shop_order_items_order_id" ON "shop_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_shop_order_items_product_id" ON "shop_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_shop_orders_member_id" ON "shop_orders" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_shop_orders_status" ON "shop_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shop_orders_order_number" ON "shop_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_shop_orders_created_at" ON "shop_orders" USING btree ("created_at");