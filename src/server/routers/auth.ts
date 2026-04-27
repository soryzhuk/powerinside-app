import { z } from "zod";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { createTelegramJWT } from "@/lib/telegram-jwt";

export const authRouter = router({
  /**
   * Register a new user.
   * Creates user with hashed password and a message balance (50 free messages).
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().optional(),
        country: z.string().optional(),
        address: z.string().optional(),
        language: z.string().default("uk"),
        role: z.enum(["ATHLETE", "COACH", "INVESTOR"]).default("ATHLETE"),
        referralCode: z.string().optional(), // code of the referrer
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists.",
        });
      }

      // Validate referral code before creating user
      let referrer: { id: string } | null = null;
      if (input.referralCode && input.role === "ATHLETE") {
        referrer = await ctx.prisma.user.findUnique({
          where: { referralCode: input.referralCode },
          select: { id: true },
        });
      }

      const passwordHash = await hash(input.password, 12);

      // Welcome bonus: 5 extra purchased messages if referred (ТЗ п.8: 5% welcome)
      const welcomeBonus = referrer ? 5 : 0;

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          phone: input.phone,
          country: input.country,
          address: input.address,
          language: input.language,
          role: input.role,
          balance: {
            create: {
              freeRemaining: 50,
              weeklyRemaining: 0,
              purchasedRemaining: welcomeBonus,
            },
          },
          ...(input.role === "COACH"
            ? { coachProfile: { create: { status: "PENDING" } } }
            : {}),
        },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });

      // Record referral relationship
      if (referrer) {
        await ctx.prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            bonusAmount: 5, // messages to give referrer on first payment
            claimed: false,
          },
        }).catch(() => {}); // ignore duplicate (referrerId+referredId unique)
      }

      return user;
    }),

  /**
   * Get current session.
   */
  getSession: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),

  /**
   * Select role during Telegram Mini App onboarding.
   * Returns a new JWT with the updated role so the client can use coach/athlete procedures immediately.
   */
  selectRole: protectedProcedure
    .input(z.object({ role: z.enum(["ATHLETE", "COACH"]) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { role: input.role },
      });

      if (input.role === "COACH") {
        const existing = await ctx.prisma.coachProfile.findUnique({
          where: { userId: user.id },
        });
        if (!existing) {
          await ctx.prisma.coachProfile.create({
            data: { userId: user.id, status: "PENDING" },
          });
        }
      }

      if (!user.telegramId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No telegramId on user." });
      }

      const token = createTelegramJWT({
        userId: user.id,
        telegramId: user.telegramId,
        role: user.role,
      });

      return { token, role: user.role };
    }),
});
