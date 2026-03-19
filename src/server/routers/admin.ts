import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../trpc";

export const adminRouter = router({
  /**
   * List all coaches with their profiles and status.
   */
  getCoaches: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.coachProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            interviewSessions: true,
            knowledgeBase: true,
            methodologyRules: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Activate a coach (set status to ACTIVE).
   */
  activateCoach: adminProcedure
    .input(z.object({ coachId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { id: input.coachId },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach profile not found.",
        });
      }

      return ctx.prisma.coachProfile.update({
        where: { id: input.coachId },
        data: { status: "ACTIVE" },
      });
    }),

  /**
   * Suspend a coach (set status to SUSPENDED).
   */
  suspendCoach: adminProcedure
    .input(z.object({ coachId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { id: input.coachId },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach profile not found.",
        });
      }

      return ctx.prisma.coachProfile.update({
        where: { id: input.coachId },
        data: { status: "SUSPENDED" },
      });
    }),

  /**
   * List users with pagination.
   */
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        role: z
          .enum(["ATHLETE", "COACH", "INVESTOR", "ADMIN", "OWNER"])
          .optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.role) {
        where.role = input.role;
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            country: true,
            language: true,
            createdAt: true,
            _count: {
              select: {
                conversations: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.perPage,
          take: input.perPage,
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page: input.page,
        perPage: input.perPage,
        totalPages: Math.ceil(total / input.perPage),
      };
    }),

  /**
   * Get platform statistics.
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalCoaches,
      activeCoaches,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.coachProfile.count(),
      ctx.prisma.coachProfile.count({
        where: { status: "ACTIVE" },
      }),
      ctx.prisma.subscription.count(),
      ctx.prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
      ctx.prisma.messagePackPurchase.aggregate({
        _sum: { amount: true },
      }),
    ]);

    return {
      totalUsers,
      totalCoaches,
      activeCoaches,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }),
});
