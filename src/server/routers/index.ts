import { router } from "../trpc";
import { authRouter } from "./auth";
import { coachRouter } from "./coach";
import { athleteRouter } from "./athlete";
import { adminRouter } from "./admin";
import { billingRouter } from "./billing";
import { qaRouter } from "./qa";
import { referralRouter } from "./referral";

export const appRouter = router({
  auth: authRouter,
  coach: coachRouter,
  athlete: athleteRouter,
  admin: adminRouter,
  billing: billingRouter,
  qa: qaRouter,
  referral: referralRouter,
});

export type AppRouter = typeof appRouter;
