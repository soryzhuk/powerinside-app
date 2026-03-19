import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, coachProcedure } from "../trpc";

export const qaRouter = router({
  /**
   * Athlete creates a multi-expert question.
   * Sends it to selected coaches (creates pending ExpertAnswer slots).
   */
  createQuestion: protectedProcedure
    .input(
      z.object({
        content: z.string().min(10, "Питання має бути не менше 10 символів"),
        coachIds: z.array(z.string()).min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check message balance
      const balance = await ctx.prisma.messageBalance.findUnique({
        where: { userId },
      });

      const total =
        (balance?.freeRemaining ?? 0) +
        (balance?.weeklyRemaining ?? 0) +
        (balance?.purchasedRemaining ?? 0);

      if (total <= 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Недостатньо повідомлень на балансі.",
        });
      }

      // Deduct 1 message
      if ((balance?.freeRemaining ?? 0) > 0) {
        await ctx.prisma.messageBalance.update({
          where: { userId },
          data: { freeRemaining: { decrement: 1 } },
        });
      } else if ((balance?.weeklyRemaining ?? 0) > 0) {
        await ctx.prisma.messageBalance.update({
          where: { userId },
          data: { weeklyRemaining: { decrement: 1 } },
        });
      } else {
        await ctx.prisma.messageBalance.update({
          where: { userId },
          data: { purchasedRemaining: { decrement: 1 } },
        });
      }

      // Create conversation
      const conversation = await ctx.prisma.conversation.create({
        data: {
          userId,
          type: "MULTI_EXPERT",
          messages: {
            create: {
              role: "user",
              content: input.content,
              billed: true,
            },
          },
          // Create empty answer slots for each coach
          expertAnswers: {
            create: input.coachIds.map((coachId) => ({
              coachId,
              content: "",
              selected: false,
            })),
          },
        },
        include: {
          messages: true,
          expertAnswers: true,
        },
      });

      return conversation;
    }),

  /**
   * Coach sees questions directed to them.
   */
  getCoachQuestions: coachProcedure.query(async ({ ctx }) => {
    return ctx.prisma.expertAnswer.findMany({
      where: { coachId: ctx.session.user.id },
      include: {
        conversation: {
          include: {
            messages: {
              where: { role: "user" },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Coach submits an answer to a question.
   */
  answerQuestion: coachProcedure
    .input(
      z.object({
        answerId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const answer = await ctx.prisma.expertAnswer.findFirst({
        where: {
          id: input.answerId,
          coachId: ctx.session.user.id,
        },
      });

      if (!answer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Answer not found.",
        });
      }

      return ctx.prisma.expertAnswer.update({
        where: { id: input.answerId },
        data: { content: input.content },
      });
    }),

  /**
   * Athlete gets their multi-expert questions with answers.
   */
  getMyQuestions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.conversation.findMany({
      where: {
        userId: ctx.session.user.id,
        type: "MULTI_EXPERT",
      },
      include: {
        messages: {
          where: { role: "user" },
          take: 1,
        },
        expertAnswers: {
          include: {
            coach: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Athlete selects the best answer.
   */
  selectBestAnswer: protectedProcedure
    .input(z.object({ answerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find the answer and verify ownership
      const answer = await ctx.prisma.expertAnswer.findUnique({
        where: { id: input.answerId },
        include: { conversation: true },
      });

      if (!answer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Answer not found." });
      }

      if (answer.conversation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your question." });
      }

      // Deselect all answers in this conversation, then select the chosen one
      await ctx.prisma.expertAnswer.updateMany({
        where: { conversationId: answer.conversationId },
        data: { selected: false },
      });

      return ctx.prisma.expertAnswer.update({
        where: { id: input.answerId },
        data: { selected: true },
      });
    }),

  /**
   * Get active coaches list for athlete to pick from.
   */
  getActiveCoaches: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.coachProfile.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }),
});
