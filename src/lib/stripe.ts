import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
  typescript: true,
});

export interface Plan {
  id: SubscriptionPlanId;
  name: string;
  price: number; // in dollars
  priceInCents: number;
  weeklyMessages: number;
  features: string[];
  stripePriceId: string | undefined;
}

export type SubscriptionPlanId = "BASIC" | "INDIVIDUAL" | "PERSONAL";

export const PLANS: Record<SubscriptionPlanId, Plan> = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    price: 30,
    priceInCents: 3000,
    weeklyMessages: 10,
    features: [
      "AI coach chat",
      "10 messages per week",
      "Access to coach's methodology",
    ],
    stripePriceId: process.env.STRIPE_PRICE_BASIC,
  },
  INDIVIDUAL: {
    id: "INDIVIDUAL",
    name: "Individual",
    price: 120,
    priceInCents: 12000,
    weeklyMessages: 100,
    features: [
      "AI coach chat",
      "100 messages per week",
      "Access to coach's methodology",
      "Priority responses",
      "Multi-expert Q&A",
    ],
    stripePriceId: process.env.STRIPE_PRICE_INDIVIDUAL,
  },
  PERSONAL: {
    id: "PERSONAL",
    name: "Personal",
    price: 250,
    priceInCents: 25000,
    weeklyMessages: -1, // unlimited
    features: [
      "AI coach chat",
      "Unlimited messages",
      "Access to coach's methodology",
      "Priority responses",
      "Multi-expert Q&A",
      "Direct coach escalation",
    ],
    stripePriceId: process.env.STRIPE_PRICE_PERSONAL,
  },
};

export interface MessagePack {
  id: string;
  quantity: number;
  price: number; // in dollars
  priceInCents: number;
  pricePerMessage: number;
  stripePriceId: string | undefined;
}

export const MESSAGE_PACKS: MessagePack[] = [
  {
    id: "pack_10",
    quantity: 10,
    price: 10,
    priceInCents: 1000,
    pricePerMessage: 1.0,
    stripePriceId: process.env.STRIPE_PRICE_PACK_10,
  },
  {
    id: "pack_20",
    quantity: 20,
    price: 18,
    priceInCents: 1800,
    pricePerMessage: 0.9,
    stripePriceId: process.env.STRIPE_PRICE_PACK_20,
  },
  {
    id: "pack_50",
    quantity: 50,
    price: 30,
    priceInCents: 3000,
    pricePerMessage: 0.6,
    stripePriceId: process.env.STRIPE_PRICE_PACK_50,
  },
  {
    id: "pack_100",
    quantity: 100,
    price: 50,
    priceInCents: 5000,
    pricePerMessage: 0.5,
    stripePriceId: process.env.STRIPE_PRICE_PACK_100,
  },
];

/**
 * Get a plan by its ID.
 */
export function getPlan(planId: SubscriptionPlanId): Plan {
  return PLANS[planId];
}

/**
 * Get a message pack by its ID.
 */
export function getMessagePack(packId: string): MessagePack | undefined {
  return MESSAGE_PACKS.find((p) => p.id === packId);
}

/**
 * Get weekly message limit for a given plan.
 * Returns -1 for unlimited (Personal plan).
 */
export function getWeeklyMessageLimit(planId: SubscriptionPlanId): number {
  return PLANS[planId].weeklyMessages;
}

export default stripe;
