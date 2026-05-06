import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const sportRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.sport.findMany({
      where: { approved: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(2).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      const existing = await ctx.prisma.sport.findUnique({ where: { name } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Такий вид спорту вже існує." });
      }
      return ctx.prisma.sport.create({ data: { name, approved: true } });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.sport.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  listPending: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.coachProfile.findMany({
      where: { customSport: { not: null }, customSportApproved: false },
      select: {
        id: true,
        customSport: true,
        user: { select: { name: true, telegramId: true } },
      },
    });
  }),

  approveCustomSport: adminProcedure
    .input(z.object({ coachProfileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { id: input.coachProfileId },
        select: { customSport: true, userId: true, user: { select: { telegramId: true } } },
      });
      if (!profile?.customSport) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coach or custom sport not found." });
      }

      // upsert the sport
      const sport = await ctx.prisma.sport.upsert({
        where: { name: profile.customSport },
        update: { approved: true },
        create: { name: profile.customSport, approved: true },
      });

      await ctx.prisma.coachProfile.update({
        where: { id: input.coachProfileId },
        data: { sportId: sport.id, customSportApproved: true },
      });

      // notify via Telegram bot if telegramId available
      const telegramId = profile.user.telegramId;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (telegramId && botToken) {
        const text = `✅ Ваш вид спорту «${profile.customSport}» схвалено! Тепер ви можете пройти інтерв'ю.`;
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramId, text }),
        }).catch(() => {});
      }

      return { ok: true, sportId: sport.id };
    }),

  rejectCustomSport: adminProcedure
    .input(z.object({ coachProfileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { id: input.coachProfileId },
        select: { customSport: true, user: { select: { telegramId: true } } },
      });

      await ctx.prisma.coachProfile.update({
        where: { id: input.coachProfileId },
        data: { customSport: null, customSportApproved: false },
      });

      const telegramId = profile?.user.telegramId;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (telegramId && botToken) {
        const text = `❌ На жаль, вид спорту «${profile?.customSport}» не схвалено. Будь ласка, оберіть інший зі списку або запропонуйте нову назву.`;
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramId, text }),
        }).catch(() => {});
      }

      return { ok: true };
    }),
});
