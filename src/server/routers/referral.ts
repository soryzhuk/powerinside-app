import { router, protectedProcedure } from "../trpc";

export const referralRouter = router({
  /**
   * Get current user's referral code and stats.
   */
  getMyReferral: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { referralCode: true },
    });

    const referrals = await ctx.prisma.referral.findMany({
      where: { referrerId: ctx.session.user.id },
      include: {
        referred: { select: { name: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const claimed = referrals.filter((r) => r.claimed).length;
    const pending = referrals.filter((r) => !r.claimed).length;
    const totalBonusMessages = referrals
      .filter((r) => r.claimed)
      .reduce((s, r) => s + r.bonusAmount, 0);

    return {
      referralCode: user?.referralCode ?? "",
      totalReferrals: referrals.length,
      claimed,
      pending,
      totalBonusMessages,
      referrals: referrals.map((r) => ({
        id: r.id,
        referredName: r.referred.name ?? "—",
        joinedAt: r.referred.createdAt,
        claimed: r.claimed,
        bonusAmount: r.bonusAmount,
      })),
    };
  }),
});
