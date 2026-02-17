export type PlanId = "free" | "starter" | "pro";

export type PlanConfig = {
  id: PlanId;
  name: string;
  priceLabel: string;
  monthlyCredits: number;
  description: string;
  priceId?: string;
};

export type CreditPackConfig = {
  id: string;
  credits: number;
  priceLabel: string;
  priceId?: string;
};

const env = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
};

export const PLAN_CATALOG: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0/mo",
    monthlyCredits: 50,
    description: "Ideal for testing a small project.",
  },
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$15/mo",
    monthlyCredits: 200,
    description: "For indie teams shipping small sequences.",
    priceId: env("NEXT_PUBLIC_STRIPE_PRICE_STARTER"),
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$35/mo",
    monthlyCredits: 600,
    description: "For production pipelines and daily iteration.",
    priceId: env("NEXT_PUBLIC_STRIPE_PRICE_PRO"),
  },
];

export const CREDIT_PACKS: CreditPackConfig[] = [
  {
    id: "credits-500",
    credits: 500,
    priceLabel: "$10",
    priceId: env("NEXT_PUBLIC_STRIPE_PRICE_CREDITS_500"),
  },
  {
    id: "credits-1500",
    credits: 1500,
    priceLabel: "$25",
    priceId: env("NEXT_PUBLIC_STRIPE_PRICE_CREDITS_1500"),
  },
  {
    id: "credits-3500",
    credits: 3500,
    priceLabel: "$50",
    priceId: env("NEXT_PUBLIC_STRIPE_PRICE_CREDITS_3500"),
  },
];

export function getPlanById(planId: string | null | undefined): PlanConfig | undefined {
  if (!planId) return undefined;
  return PLAN_CATALOG.find((plan) => plan.id === planId);
}

export function resolvePlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLAN_CATALOG.find((plan) => plan.priceId === priceId);
}

export function resolveCreditPackByPriceId(priceId: string): CreditPackConfig | undefined {
  return CREDIT_PACKS.find((pack) => pack.priceId === priceId);
}
