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
        role: z
          .enum(["ATHLETE", "COACH", "INVESTOR"])
          .default("ATHLETE"),
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

      const passwordHash = await hash(input.password, 12);

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
              purchasedRemaining: 0,
            },
          },
          // If registering as COACH, also create a coach profile
          ...(input.role === "COACH"
            ? {
                coachProfile: {
                  create: {
                    status: "PENDING",
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

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
