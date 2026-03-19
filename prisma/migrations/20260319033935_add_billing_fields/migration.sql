-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "platformFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'subscription',
ADD COLUMN     "stripePaymentId" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "coachId" TEXT;
