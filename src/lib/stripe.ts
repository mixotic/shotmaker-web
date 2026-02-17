import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  }
  return _stripe;
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function getOrCreateCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const existing = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const stripeCustomerId = existing[0]?.stripeCustomerId;
  if (stripeCustomerId) return stripeCustomerId;

  const customer = await getStripe().customers.create({
    email,
    metadata: { userId },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  mode: Stripe.Checkout.SessionCreateParams.Mode,
): Promise<Stripe.Checkout.Session> {
  const u = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const email = u[0]?.email;
  if (!email) throw new Error("User not found");

  const customerId = await getOrCreateCustomer(userId, email);

  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/settings?checkout=success`,
    cancel_url: `${appUrl()}/settings?checkout=cancel`,
    metadata: { userId },
  });
}

export async function createCustomerPortalSession(
  customerId: string,
): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/settings`,
  });
}
