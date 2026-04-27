-- AlterTable interview_round_summaries:
-- 1. Drop old unique constraint on sessionId
-- 2. Add fingerprint and openQuestions text columns
-- 3. Add round column as text first, fill, then cast to enum
-- 4. Add new unique constraint (sessionId, round)

ALTER TABLE "interview_round_summaries"
  DROP CONSTRAINT IF EXISTS "interview_round_summaries_sessionId_key";

ALTER TABLE "interview_round_summaries"
  ADD COLUMN IF NOT EXISTS "fingerprint" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "openQuestions" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "round_tmp" TEXT NOT NULL DEFAULT 'FULL_INTERVIEW';

-- Fill round_tmp for existing rows
UPDATE "interview_round_summaries" SET "round_tmp" = 'FULL_INTERVIEW';

-- Add enum column using the text column
ALTER TABLE "interview_round_summaries"
  ADD COLUMN IF NOT EXISTS "round" "InterviewRound";

UPDATE "interview_round_summaries" SET "round" = 'FULL_INTERVIEW'::"InterviewRound";

ALTER TABLE "interview_round_summaries"
  ALTER COLUMN "round" SET NOT NULL;

ALTER TABLE "interview_round_summaries"
  DROP COLUMN "round_tmp";

-- Add new unique constraint
ALTER TABLE "interview_round_summaries"
  ADD CONSTRAINT "interview_round_summaries_sessionId_round_key"
  UNIQUE ("sessionId", "round");
