import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, coachProcedure } from "../trpc";
import { chatWithCoach, type ChatMessage } from "@/lib/ai/claude";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { InterviewRound } from "@/app/generated/prisma/client";

export const coachRouter = router({
  /**
   * Get coach profile for the current user.
   */
  getProfile: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
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
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach profile not found.",
      });
    }

    return profile;
  }),

  /**
   * Get or create an interview session for a specific round.
   */
  getInterviewSession: coachProcedure
    .input(
      z.object({
        round: z.enum([
          "TARGET_ATHLETE",
          "LOAD_MANAGEMENT",
          "AUTOREGULATION",
          "PROGRESSION_DELOAD",
          "EXERCISE_SELECTION",
          "TECHNIQUE_STANDARDS",
          "LIFESTYLE_RECOVERY",
        ]),
      })
    )
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach profile not found.",
        });
      }

      let session = await ctx.prisma.interviewSession.findUnique({
        where: {
          coachId_round: {
            coachId: profile.id,
            round: input.round as InterviewRound,
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          summary: true,
        },
      });

      if (!session) {
        session = await ctx.prisma.interviewSession.create({
          data: {
            coachId: profile.id,
            round: input.round as InterviewRound,
            status: "IN_PROGRESS",
          },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
            summary: true,
          },
        });
      }

      return session;
    }),

  /**
   * Send a message in an interview session.
   * Saves the user message, calls Claude AI, saves and returns the assistant response.
   */
  sendInterviewMessage: coachProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach profile not found.",
        });
      }

      const session = await ctx.prisma.interviewSession.findFirst({
        where: {
          id: input.sessionId,
          coachId: profile.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interview session not found.",
        });
      }

      if (session.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This interview round is already completed.",
        });
      }

      // Save user message
      await ctx.prisma.interviewMessage.create({
        data: {
          sessionId: input.sessionId,
          role: "user",
          content: input.content,
        },
      });

      // Build message history for Claude
      const history: ChatMessage[] = session.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      history.push({ role: "user", content: input.content });

      // Call Claude AI
      const aiResponse = await chatWithCoach(history, INTERVIEW_SYSTEM_PROMPT);

      // Save assistant response
      const assistantMessage = await ctx.prisma.interviewMessage.create({
        data: {
          sessionId: input.sessionId,
          role: "assistant",
          content: aiResponse,
        },
      });

      return assistantMessage;
    }),

  /**
   * Mark an interview round as completed.
   */
  completeRound: coachProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach profile not found.",
        });
      }

      const session = await ctx.prisma.interviewSession.findFirst({
        where: {
          id: input.sessionId,
          coachId: profile.id,
        },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interview session not found.",
        });
      }

      const updated = await ctx.prisma.interviewSession.update({
        where: { id: input.sessionId },
        data: { status: "COMPLETED" },
        include: {
          summary: true,
        },
      });

      return updated;
    }),

  /**
   * Get all knowledge entries for the current coach.
   */
  getKnowledgeBase: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach profile not found.",
      });
    }

    return ctx.prisma.knowledgeEntry.findMany({
      where: { coachId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Get all methodology rules for the current coach.
   */
  getRules: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach profile not found.",
      });
    }

    return ctx.prisma.methodologyRule.findMany({
      where: { coachId: profile.id },
      orderBy: [{ round: "asc" }, { createdAt: "asc" }],
    });
  }),
});
