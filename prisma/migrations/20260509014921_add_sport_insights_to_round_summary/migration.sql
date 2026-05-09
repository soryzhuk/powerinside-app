-- DropIndex
DROP INDEX "interview_round_summaries_sessionId_key";

-- AlterTable
ALTER TABLE "interview_round_summaries" ADD COLUMN     "sportInsights" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "fingerprint" SET DEFAULT '',
ALTER COLUMN "fingerprint" SET DATA TYPE TEXT;
