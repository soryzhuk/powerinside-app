-- Add referralCode to users (unique, auto-generated via gen_random_uuid for existing rows)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Fill existing rows with unique codes
UPDATE "users" SET "referralCode" = gen_random_uuid()::text WHERE "referralCode" IS NULL;

-- Make NOT NULL and add unique constraint
ALTER TABLE "users"
  ALTER COLUMN "referralCode" SET NOT NULL,
  ADD CONSTRAINT "users_referralCode_key" UNIQUE ("referralCode");
