import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, coachProcedure, protectedProcedure } from "../trpc";
import { chatWithCoach, type ChatMessage } from "@/lib/ai/claude";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { InterviewRound } from "@/app/generated/prisma/client";
import {
  sendInterviewRoundCompletedEmail,
  sendInterviewCompletedEmail,
} from "@/lib/email";

// ── Round Summary parser ─────────────────────────────────────────────────────

const VALID_ROUNDS = [
  "TARGET_ATHLETE",
  "LOAD_MANAGEMENT",
  "AUTOREGULATION",
  "PROGRESSION_DELOAD",
  "EXERCISE_SELECTION",
  "TECHNIQUE_STANDARDS",
  "LIFESTYLE_RECOVERY",
] as const;

type RoundName = (typeof VALID_ROUNDS)[number];

interface ParsedRule {
  title: string;
  condition: string;
  signal: string;
  decision: string;
  exception: string;
  alternative: string;
}

interface ParsedSummary {
  round: RoundName;
  insights: string;
  rules: ParsedRule[];
  terminology: string[];
  fingerprint: string;
  openQuestions: string;
}

function parseRoundSummary(text: string): ParsedSummary | null {
  const match = text.match(
    /\[ROUND_SUMMARY_START:(\w+)\]([\s\S]*?)\[ROUND_SUMMARY_END\]/
  );
  if (!match) return null;

  const [, roundRaw, body] = match;
  const round = roundRaw as RoundName;
  if (!VALID_ROUNDS.includes(round)) return null;

  const insights = body.match(/INSIGHTS:\s*([\s\S]+?)(?=\nRULES:|\nTERMINOLOGY:)/)?.[1]?.trim() ?? "";
  const rulesBlock = body.match(/RULES:\n([\s\S]*?)(?=\nTERMINOLOGY:)/)?.[1] ?? "";
  const terminologyRaw = body.match(/TERMINOLOGY:\s*([\s\S]+?)(?=\nFINGERPRINT:|\nOPEN_QUESTIONS:)/)?.[1]?.trim() ?? "";
  const fingerprint = body.match(/FINGERPRINT:\s*([\s\S]+?)(?=\nOPEN_QUESTIONS:)/)?.[1]?.trim() ?? "";
  const openQuestions = body.match(/OPEN_QUESTIONS:\s*([\s\S]+?)$/)?.[1]?.trim() ?? "";

  const terminology = terminologyRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const rules: ParsedRule[] = [];
  const ruleBlocks = rulesBlock.split(/(?=- Title:)/);
  for (const block of ruleBlocks) {
    const title = block.match(/- Title:\s*(.+)/)?.[1]?.trim();
    if (!title) continue;
    rules.push({
      title,
      condition: block.match(/Condition:\s*(.+)/)?.[1]?.trim() ?? "",
      signal:    block.match(/Signal:\s*(.+)/)?.[1]?.trim() ?? "",
      decision:  block.match(/Decision:\s*(.+)/)?.[1]?.trim() ?? "",
      exception: block.match(/Exception:\s*(.+)/)?.[1]?.trim() ?? "",
      alternative: block.match(/Alternative:\s*(.+)/)?.[1]?.trim() ?? "",
    });
  }

  return { round, insights, rules, terminology, fingerprint, openQuestions };
}

const ROUND_LABELS: Record<string, string> = {
  TARGET_ATHLETE:    "Профіль атлета та система",
  LOAD_MANAGEMENT:   "Логіка призначення навантаження",
  AUTOREGULATION:    "Авторегуляція та готовність",
  PROGRESSION_DELOAD:"Архітектура прогресії",
  EXERCISE_SELECTION:"Стратегія підбору вправ",
  TECHNIQUE_STANDARDS:"Технічні стандарти та рух",
  LIFESTYLE_RECOVERY: "Екосистема відновлення",
};

const TOTAL_ROUNDS = 7;

export const coachRouter = router({
  selectSport: coachProcedure
    .input(z.object({ sportId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sport = await ctx.prisma.sport.findUnique({ where: { id: input.sportId } });
      if (!sport) throw new TRPCError({ code: "NOT_FOUND", message: "Sport not found." });
      const profile = await ctx.prisma.coachProfile.findUnique({ where: { userId: ctx.session.user.id } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found." });
      return ctx.prisma.coachProfile.update({
        where: { id: profile.id },
        data: { sportId: input.sportId, customSport: null, customSportApproved: false },
      });
    }),

  proposeCustomSport: coachProcedure
    .input(z.object({ name: z.string().min(2).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim();
      const profile = await ctx.prisma.coachProfile.findUnique({ where: { userId: ctx.session.user.id } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found." });

      // check if sport already exists and approved
      const existing = await ctx.prisma.sport.findUnique({ where: { name } });
      if (existing?.approved) {
        await ctx.prisma.coachProfile.update({
          where: { id: profile.id },
          data: { sportId: existing.id, customSport: null, customSportApproved: false },
        });
        return { approved: true, sportId: existing.id };
      }

      await ctx.prisma.coachProfile.update({
        where: { id: profile.id },
        data: { customSport: name, sportId: null, customSportApproved: false },
      });
      return { approved: false };
    }),

  getSportInfo: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
      select: { sportId: true, customSport: true, customSportApproved: true, sport: { select: { name: true } } },
    });
    return profile ?? null;
  }),

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
   * Get or create the unified full interview session.
   * If the session is new, auto-generates the opening AI message.
   */
  getFullInterviewSession: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found." });
    }

    let session = await ctx.prisma.interviewSession.findUnique({
      where: {
        coachId_round: { coachId: profile.id, round: "FULL_INTERVIEW" as InterviewRound },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) {
      session = await ctx.prisma.interviewSession.create({
        data: { coachId: profile.id, round: "FULL_INTERVIEW" as InterviewRound, status: "IN_PROGRESS" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      // Auto-generate the opening message from the AI
      const opening = await chatWithCoach([], INTERVIEW_SYSTEM_PROMPT);
      await ctx.prisma.interviewMessage.create({
        data: { sessionId: session.id, role: "assistant", content: opening },
      });

      session = await ctx.prisma.interviewSession.findUnique({
        where: { id: session.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      }) as NonNullable<typeof session>;
    }

    return session;
  }),

  /**
   * Get or create an interview session for a specific round (legacy).
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
          summaries: true,
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
            summaries: true,
          },
        });
      }

      return session;
    }),

  /**
   * Send a message in an interview session.
   * Detects [INTERVIEW_COMPLETE] signal and auto-completes the session.
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found." });
      }

      const session = await ctx.prisma.interviewSession.findFirst({
        where: { id: input.sessionId, coachId: profile.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Interview session not found." });
      }

      if (session.status === "COMPLETED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This interview is already completed." });
      }

      await ctx.prisma.interviewMessage.create({
        data: { sessionId: input.sessionId, role: "user", content: input.content },
      });

      const history: ChatMessage[] = session.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      history.push({ role: "user", content: input.content });

      const rawResponse = await chatWithCoach(history, INTERVIEW_SYSTEM_PROMPT);

      const COMPLETE_SIGNAL = "[INTERVIEW_COMPLETE]";
      const isComplete = rawResponse.includes(COMPLETE_SIGNAL);

      // Remove tags from visible content
      let cleanContent = rawResponse
        .replace(COMPLETE_SIGNAL, "")
        .replace(/\[ROUND_SUMMARY_START:\w+\][\s\S]*?\[ROUND_SUMMARY_END\]/g, "")
        .trim();

      const assistantMessage = await ctx.prisma.interviewMessage.create({
        data: { sessionId: input.sessionId, role: "assistant", content: rawResponse },
      });

      // Parse and save Round Summary if present
      const parsedSummary = parseRoundSummary(rawResponse);
      if (parsedSummary) {
        // Prisma Json fields require plain objects — serialize arrays through JSON
        const rulesJson = JSON.parse(JSON.stringify(parsedSummary.rules)) as object[];
        const terminologyJson = JSON.parse(JSON.stringify(parsedSummary.terminology)) as string[];

        await ctx.prisma.interviewRoundSummary.upsert({
          where: { sessionId_round: { sessionId: input.sessionId, round: parsedSummary.round as InterviewRound } },
          update: {
            insights: parsedSummary.insights,
            rules: rulesJson,
            terminology: terminologyJson,
            fingerprint: parsedSummary.fingerprint,
            openQuestions: parsedSummary.openQuestions,
          },
          create: {
            sessionId: input.sessionId,
            round: parsedSummary.round as InterviewRound,
            insights: parsedSummary.insights,
            rules: rulesJson,
            terminology: terminologyJson,
            fingerprint: parsedSummary.fingerprint,
            openQuestions: parsedSummary.openQuestions,
          },
        });

        // Save individual rules to MethodologyRule table
        for (const rule of parsedSummary.rules) {
          await ctx.prisma.methodologyRule.create({
            data: {
              coachId: profile.id,
              round: parsedSummary.round as InterviewRound,
              title: rule.title,
              condition: rule.condition || null,
              signal: rule.signal || null,
              decision: rule.decision || null,
              exception: rule.exception || null,
              alternative: rule.alternative || null,
              confirmed: false,
            },
          });
        }
      }

      if (isComplete) {
        await ctx.prisma.interviewSession.update({
          where: { id: input.sessionId },
          data: { status: "COMPLETED" },
        });

        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { email: true, name: true },
        });
        if (user) {
          sendInterviewCompletedEmail({
            coachEmail: user.email,
            coachName: user.name ?? "Тренер",
          }).catch(console.error);
        }
      }

      return { message: { ...assistantMessage, content: cleanContent }, isComplete, roundSummary: parsedSummary ?? undefined };
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
          summaries: true,
        },
      });

      // Send email asynchronously — don't block the response
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, name: true },
      });

      if (user) {
        const roundLabel = ROUND_LABELS[session.round] ?? session.round;
        const insights = updated.summaries?.[0]?.insights ?? "Резюме ще формується.";

        sendInterviewRoundCompletedEmail({
          coachEmail: user.email,
          coachName: user.name ?? "Тренер",
          roundLabel,
          insights,
        }).catch(console.error);

        // If all rounds completed — send final email
        const completedCount = await ctx.prisma.interviewSession.count({
          where: { coachId: profile.id, status: "COMPLETED" },
        });
        if (completedCount >= TOTAL_ROUNDS) {
          sendInterviewCompletedEmail({
            coachEmail: user.email,
            coachName: user.name ?? "Тренер",
          }).catch(console.error);
        }
      }

      return updated;
    }),

  /**
   * Confirm (or unconfirm) a methodology rule by the coach.
   * ТЗ: "Методика фіксується лише після апруву тренера"
   */
  confirmRule: coachProcedure
    .input(z.object({ ruleId: z.string(), confirmed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found." });

      return ctx.prisma.methodologyRule.update({
        where: { id: input.ruleId, coachId: profile.id },
        data: { confirmed: input.confirmed },
      });
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

  /**
   * Get payouts for the current coach (70% share from subscriptions).
   */
  getPayouts: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach profile not found.",
      });
    }

    return ctx.prisma.payout.findMany({
      where: { coachId: profile.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * List statuses of all interview sessions for the current coach.
   * Used in TG Mini App to show which rounds are completed.
   */
  listSessionStatuses: coachProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });
    if (!profile) return [];
    return ctx.prisma.interviewSession.findMany({
      where: { coachId: profile.id },
      select: { round: true, status: true },
    });
  }),

  /**
   * Reset the full interview session — deletes existing session (cascade) and
   * creates a fresh one with an opening AI message.
   */
  resetInterview: coachProcedure.mutation(async ({ ctx }) => {
    const profile = await ctx.prisma.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found." });
    }

    const existing = await ctx.prisma.interviewSession.findUnique({
      where: { coachId_round: { coachId: profile.id, round: "FULL_INTERVIEW" as InterviewRound } },
    });

    if (existing) {
      await ctx.prisma.interviewSession.delete({ where: { id: existing.id } });
    }

    const session = await ctx.prisma.interviewSession.create({
      data: { coachId: profile.id, round: "FULL_INTERVIEW" as InterviewRound, status: "IN_PROGRESS" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const opening = await chatWithCoach([], INTERVIEW_SYSTEM_PROMPT);
    await ctx.prisma.interviewMessage.create({
      data: { sessionId: session.id, role: "assistant", content: opening },
    });

    return ctx.prisma.interviewSession.findUnique({
      where: { id: session.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }),

  /**
   * List active coaches (for athletes to choose from).
   */
  listActive: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.coachProfile.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { methodologyRules: true, knowledgeBase: true } },
      },
    });
  }),
});
