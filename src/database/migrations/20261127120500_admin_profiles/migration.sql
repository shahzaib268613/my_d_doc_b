CREATE TABLE "admin_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" text DEFAULT 'default' NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"username" text NOT NULL,
	"role" text DEFAULT 'Admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_profiles_slot_uidx" ON "admin_profiles" ("slot");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_profiles_email_uidx" ON "admin_profiles" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_profiles_username_uidx" ON "admin_profiles" ("username");
