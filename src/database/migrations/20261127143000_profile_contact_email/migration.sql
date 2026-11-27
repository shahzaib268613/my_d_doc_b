ALTER TABLE "admin_profiles" ADD COLUMN IF NOT EXISTS "contact_email" text;--> statement-breakpoint
UPDATE "admin_profiles"
SET "contact_email" = COALESCE(NULLIF("contact_email", ''), "email", 'contact@mydiabetesdoc.com')
WHERE "contact_email" IS NULL OR "contact_email" = '';--> statement-breakpoint
ALTER TABLE "admin_profiles" ALTER COLUMN "contact_email" SET NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "admin_profiles_username_uidx";--> statement-breakpoint
ALTER TABLE "admin_profiles" DROP COLUMN IF EXISTS "username";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_profiles_contact_email_uidx" ON "admin_profiles" ("contact_email");
