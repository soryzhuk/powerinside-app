import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe, { PLANS, MESSAGE_PACKS } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import type { SubscriptionPlanId } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe webhook] signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId, coachId, packId, quantity } = session.metadata ?? {};
  if (!userId) return;

  if (session.mode === "subscription" && planId) {
    // Retrieve full subscription from Stripe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string) as any;

    const plan = PLANS[planId as SubscriptionPlanId];
    const nextReset = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const weeklyMessages = plan.weeklyMessages === -1 ? 9999 : plan.weeklyMessages;

    // period end — handle both old and new Stripe API shapes
    const periodEnd: Date | null = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000)
      : null;

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        coachId: coachId || null,
        plan: planId as SubscriptionPlanId,
        status: "ACTIVE",
        stripeCustomerId: session.customer as string,
        stripeSubId: stripeSub.id,
        currentPeriodEnd: periodEnd,
      },
      update: {
        coachId: coachId || null,
        plan: planId as SubscriptionPlanId,
        status: "ACTIVE",
        stripeCustomerId: session.customer as string,
        stripeSubId: stripeSub.id,
        currentPeriodEnd: periodEnd,
      },
    });

    // Reset weekly balance
    await prisma.messageBalance.upsert({
      where: { userId },
      update: { weeklyRemaining: weeklyMessages, weekResetAt: nextReset },
      create: {
        userId,
        weeklyRemaining: weeklyMessages,
        weekResetAt: nextReset,
        freeRemaining: 0,
        purchasedRemaining: 0,
      },
    });

    // Create payout record (70% to coach, 30% platform)
    if (coachId) {
      const coachProfile = await prisma.coachProfile.findUnique({
        where: { userId: coachId },
      });
      if (coachProfile && session.amount_total) {
        const coachShare = Math.floor(session.amount_total * 0.7);
        const platformFee = session.amount_total - coachShare;
        const now = new Date();

        await prisma.payout.create({
          data: {
            coachId: coachProfile.id,
            amount: coachShare,
            platformFee,
            status: "PENDING",
            sourceType: "subscription",
            stripePaymentId: session.payment_intent as string | undefined,
            periodStart: now,
            periodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  if (session.mode === "payment" && packId) {
    const pack = MESSAGE_PACKS.find((p) => p.id === packId);
    if (!pack) return;

    const qty = parseInt(quantity ?? String(pack.quantity), 10);

    // Add messages to balance
    await prisma.messageBalance.upsert({
      where: { userId },
      update: { purchasedRemaining: { increment: qty } },
      create: {
        userId,
        freeRemaining: 0,
        weeklyRemaining: 0,
        purchasedRemaining: qty,
      },
    });

    // Record purchase
    await prisma.messagePackPurchase.create({
      data: {
        userId,
        quantity: qty,
        amount: pack.priceInCents,
        stripePaymentId: session.payment_intent as string | undefined,
      },
    });
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const existing = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
  });
  if (!existing) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd = (sub as any).current_period_end
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? new Date((sub as any).current_period_end * 1000)
    : null;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: mapStripeStatus(sub.status),
      currentPeriodEnd: periodEnd,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const existing = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
  });
  if (!existing) return;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "CANCELED" },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = invoice as any;
  const subId: string | undefined =
    typeof inv.subscription === "string"
      ? inv.subscription
      : inv.subscription?.id ?? inv.parent?.subscription_details?.subscription ?? undefined;
  if (!subId) return;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubId: subId },
  });
  if (!existing) return;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "PAST_DUE" },
  });
}

function mapStripeStatus(status: string): "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" {
  switch (status) {
    case "active": return "ACTIVE";
    case "canceled": return "CANCELED";
    case "past_due": return "PAST_DUE";
    case "trialing": return "TRIALING";
    default: return "PAST_DUE";
  }
}
