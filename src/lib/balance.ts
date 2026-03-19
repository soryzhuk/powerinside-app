import prisma from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import type { SubscriptionPlanId } from "@/lib/stripe";

/**
 * Check if a user's weekly message balance needs to be reset.
 * Called before each balance read / message deduction.
 */
export async function checkAndResetWeeklyBalance(userId: string): Promise<void> {
  const balance = await prisma.messageBalance.findUnique({
    where: { userId },
  });
  if (!balance) return;

  const now = new Date();

  // Not time to reset yet
  if (balance.weekResetAt && now < balance.weekResetAt) return;

  // Check active subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== "ACTIVE") return;

  const plan = PLANS[subscription.plan as SubscriptionPlanId];
  const weeklyLimit = plan.weeklyMessages;

  const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.messageBalance.update({
    where: { userId },
    data: {
      weeklyRemaining: weeklyLimit === -1 ? 9999 : weeklyLimit,
      weekResetAt: nextReset,
    },
  });
}
