import { router } from "../trpc";
import { authRouter } from "./auth";
import { coachRouter } from "./coach";
import { athleteRouter } from "./athlete";
import { adminRouter } from "./admin";

export const appRouter = router({
  auth: authRouter,
  coach: coachRouter,
  athlete: athleteRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
