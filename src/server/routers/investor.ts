import { router, investorProcedure } from "../trpc";

export const investorRouter = router({
  /**
   * Platform analytics for investors (ТЗ п.10).
   * Read-only access to key metrics.
   */
  getReport: investorProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalCoaches,
      activeCoaches,
      activeSubscriptions,
      totalSubscriptions,
      packRevenue,
      pendingPayouts,
      completedPayouts,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.coachProfile.count(),
      ctx.prisma.coachProfile.count({ where: { status: "ACTIVE" } }),
      ctx.prisma.subscription.count({ where: { status: "ACTIVE" } }),
      ctx.prisma.subscription.count(),
      ctx.prisma.messagePackPurchase.aggregate({ _sum: { amount: true } }),
      ctx.prisma.payout.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      ctx.prisma.payout.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    ]);

    // Subscription MRR estimate: active subs × $30 (BASIC plan price)
    const mrrEstimateCents = activeSubscriptions * 3000;

    // Quarterly payouts breakdown (last 3 months)
    const quarterStart = new Date();
    quarterStart.setMonth(quarterStart.getMonth() - 3);

    const quarterlyPayouts = await ctx.prisma.payout.findMany({
      where: { createdAt: { gte: quarterStart } },
      select: { amount: true, platformFee: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const quarterPlatformRevenue = quarterlyPayouts.reduce((s, p) => s + p.platformFee, 0);
    const quarterCoachPayouts   = quarterlyPayouts.reduce((s, p) => s + p.amount, 0);

    return {
      users:               { total: totalUsers, athletes: totalUsers - totalCoaches },
      coaches:             { total: totalCoaches, active: activeCoaches },
      subscriptions:       { total: totalSubscriptions, active: activeSubscriptions },
      revenue: {
        packsCents:          packRevenue._sum.amount ?? 0,
        mrrEstimateCents,
        pendingPayoutsCents: pendingPayouts._sum.amount ?? 0,
        completedPayoutsCents: completedPayouts._sum.amount ?? 0,
      },
      quarterly: {
        platformRevenueCents: quarterPlatformRevenue,
        coachPayoutsCents:    quarterCoachPayouts,
        payoutsCount:         quarterlyPayouts.length,
      },
    };
  }),
});
