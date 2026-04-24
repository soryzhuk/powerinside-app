import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure — no auth required.
 */
export const publicProcedure = t.procedure;

/**
 * Middleware: requires an authenticated session.
 */
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Protected procedure — requires authenticated user.
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Middleware: requires COACH, ADMIN, or OWNER role.
 * Admins can access coach procedures to manage/preview coach functionality.
 */
const isCoach = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in.",
    });
  }
  const role = ctx.session.user.role;
  if (role !== "COACH" && role !== "ADMIN" && role !== "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only coaches can access this resource.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Coach procedure — requires COACH role.
 */
export const coachProcedure = t.procedure.use(isCoach);

/**
 * Middleware: requires ADMIN or OWNER role.
 */
const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in.",
    });
  }
  if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only administrators can access this resource.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Admin procedure — requires ADMIN or OWNER role.
 */
export const adminProcedure = t.procedure.use(isAdmin);
