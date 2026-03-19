import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { chatWithAthlete, type ChatMessage } from "@/lib/ai/claude";
import { checkAndResetWeeklyBalance } from "@/lib/balance";

export const athleteRouter = router({
  /**
   * Get the current user's message balance.
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    await checkAndResetWeeklyBalance(ctx.session.user.id);
    const balance = await ctx.prisma.messageBalance.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!balance) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Message balance not found.",
      });
    }

    return {
      freeRemaining: balance.freeRemaining,
      weeklyRemaining: balance.weeklyRemaining,
      purchasedRemaining: balance.purchasedRemaining,
      total:
        balance.freeRemaining +
        balance.weeklyRemaining +
        balance.purchasedRemaining,
    };
  }),

  /**
   * Ask a question to the AI coach.
   * Saves the message, checks balance, deducts a message, calls AI with coach context, saves response.
   */
  askQuestion: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        coachId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Reset weekly balance if needed
      await checkAndResetWeeklyBalance(ctx.session.user.id);

      // Check message balance
      const balance = await ctx.prisma.messageBalance.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!balance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message balance not found.",
        });
      }

      const totalBalance =
        balance.freeRemaining +
        balance.weeklyRemaining +
        balance.purchasedRemaining;

      if (totalBalance <= 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You have no messages remaining. Please purchase a message pack or upgrade your subscription.",
        });
      }

      // Get coach profile and methodology rules
      const coachProfile = await ctx.prisma.coachProfile.findUnique({
        where: { id: input.coachId },
        include: {
          user: {
            select: { name: true },
          },
          methodologyRules: {
            where: { confirmed: true },
          },
          knowledgeBase: {
            where: { approved: true },
          },
        },
      });

      if (!coachProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach not found.",
        });
      }

      // Get or create conversation
      let conversationId = input.conversationId;

      if (!conversationId) {
        const conversation = await ctx.prisma.conversation.create({
          data: {
            userId: ctx.session.user.id,
            coachId: input.coachId,
            type: "AI_QA",
          },
        });
        conversationId = conversation.id;
      }

      // Save user message
      await ctx.prisma.message.create({
        data: {
          conversationId,
          role: "user",
          content: input.content,
          billed: true,
        },
      });

      // Deduct from balance (free first, then weekly, then purchased)
      if (balance.freeRemaining > 0) {
        await ctx.prisma.messageBalance.update({
          where: { userId: ctx.session.user.id },
          data: { freeRemaining: { decrement: 1 } },
        });
      } else if (balance.weeklyRemaining > 0) {
        await ctx.prisma.messageBalance.update({
          where: { userId: ctx.session.user.id },
          data: { weeklyRemaining: { decrement: 1 } },
        });
      } else {
        await ctx.prisma.messageBalance.update({
          where: { userId: ctx.session.user.id },
          data: { purchasedRemaining: { decrement: 1 } },
        });
      }

      // Build coach context from rules and knowledge
      const rulesText = coachProfile.methodologyRules
        .map(
          (r) =>
            `Rule: ${r.title}\nCondition: ${r.condition ?? "N/A"}\nSignal: ${r.signal ?? "N/A"}\nDecision: ${r.decision ?? "N/A"}\nException: ${r.exception ?? "N/A"}\nAlternative: ${r.alternative ?? "N/A"}`
        )
        .join("\n\n");

      const knowledgeText = coachProfile.knowledgeBase
        .map((k) => `Q: ${k.question}\nA: ${k.answer}`)
        .join("\n\n");

      const coachRules = [rulesText, knowledgeText].filter(Boolean).join("\n\n---\n\n");

      // Get conversation history for context
      const previousMessages = await ctx.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });

      const history: ChatMessage[] = previousMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Call AI
      const aiResponse = await chatWithAthlete(history, {
        coachName: coachProfile.user.name ?? "Coach",
        coachRules: coachRules || "No methodology rules have been documented yet.",
      });

      // Save assistant response
      const assistantMessage = await ctx.prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: aiResponse,
          billed: false,
        },
      });

      return {
        conversationId,
        message: assistantMessage,
      };
    }),

  /**
   * List all conversations for the current user.
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.conversation.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }),

  /**
   * Get a single conversation with all messages.
   */
  getConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          userId: ctx.session.user.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found.",
        });
      }

      return conversation;
    }),
});
