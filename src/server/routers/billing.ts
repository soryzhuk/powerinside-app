import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import stripe, { PLANS, MESSAGE_PACKS } from "@/lib/stripe";
import type { SubscriptionPlanId } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const billingRouter = router({
  /**
   * Create a Stripe Checkout session for a subscription or message pack.
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        type: z.enum(["subscription", "pack"]),
        planId: z.string(),
        coachId: z.string().optional(), // for subscriptions: which coach
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get or create Stripe customer
      let stripeCustomerId: string | undefined;
      const existingSub = await ctx.prisma.subscription.findUnique({
        where: { userId },
      });
      stripeCustomerId = existingSub?.stripeCustomerId ?? undefined;

      if (!stripeCustomerId) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        const customer = await stripe.customers.create({
          email: user?.email,
          name: user?.name ?? undefined,
          metadata: { userId },
        });
        stripeCustomerId = customer.id;
      }

      if (input.type === "subscription") {
        const plan = PLANS[input.planId as SubscriptionPlanId];
        if (!plan) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown plan." });
        }
        if (!plan.stripePriceId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Stripe price not configured for this plan.",
          });
        }

        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: plan.stripePriceId, quantity: 1 }],
          success_url: `${APP_URL}/balance?success=1`,
          cancel_url: `${APP_URL}/balance?canceled=1`,
          metadata: {
            userId,
            planId: input.planId,
            coachId: input.coachId ?? "",
          },
        });

        return { url: session.url };
      }

      // Message pack purchase
      const pack = MESSAGE_PACKS.find((p) => p.id === input.planId);
      if (!pack) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown pack." });
      }
      if (!pack.stripePriceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stripe price not configured for this pack.",
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: pack.stripePriceId, quantity: 1 }],
        success_url: `${APP_URL}/balance?success=1`,
        cancel_url: `${APP_URL}/balance?canceled=1`,
        metadata: {
          userId,
          packId: input.planId,
          quantity: String(pack.quantity),
        },
      });

      return { url: session.url };
    }),

  /**
   * Get current subscription for the logged-in user.
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),
});
