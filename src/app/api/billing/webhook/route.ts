import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { creditTransactions, users } from "@/db/schema";
import { addCredits } from "@/lib/credits";
import { getPlanById, resolveCreditPackByPriceId, resolvePlanByPriceId } from "@/lib/billing";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function resolveUserIdFromCustomer(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return row?.id ?? null;
}

async function setCreditsForUser(
  userId: string,
  newCredits: number,
  reason: string,
  referenceId?: string,
) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) return;
    const delta = newCredits - row.credits;

    await tx
      .update(users)
      .set({ credits: newCredits, updatedAt: sql`now()` })
      .where(eq(users.id, userId));

    if (delta !== 0) {
      await tx.insert(creditTransactions).values({
        userId,
        amount: delta,
        reason,
        referenceId,
        balanceAfter: newCredits,
      });
    }
  });
}

async function updatePlanForUser(
  userId: string,
  planId: string,
  subscriptionId?: string | null,
) {
  await db
    .update(users)
    .set({
      plan: planId,
      stripeSubscriptionId: subscriptionId ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, userId));
}

async function resolvePriceIdFromSession(
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  if (session.line_items?.data?.length) {
    return session.line_items.data[0]?.price?.id ?? null;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
  });
  return lineItems.data[0]?.price?.id ?? null;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      requiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err?.message ?? String(err)}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        (session.metadata?.userId as string | undefined) ??
        (await resolveUserIdFromCustomer(session.customer as string | null));

      if (!userId) break;

      if (session.mode === "subscription" && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        const priceId =
          subscription.items.data[0]?.price?.id ??
          (await resolvePriceIdFromSession(session));
        if (!priceId) break;

        const plan = resolvePlanByPriceId(priceId);
        if (!plan) break;

        await updatePlanForUser(userId, plan.id, subscription.id);
        await setCreditsForUser(
          userId,
          plan.monthlyCredits,
          "subscription_start",
          session.id,
        );
        break;
      }

      if (session.mode === "payment") {
        const priceId = await resolvePriceIdFromSession(session);
        if (!priceId) break;
        const pack = resolveCreditPackByPriceId(priceId);
        if (!pack) break;

        await addCredits(userId, pack.credits, "credit_pack_purchase", session.id);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string | null;
      const userId = await resolveUserIdFromCustomer(customerId);
      if (!userId) break;

      const priceId = invoice.lines.data[0]?.price?.id ?? null;
      const plan = priceId ? resolvePlanByPriceId(priceId) : undefined;
      const resolvedPlan = plan ?? getPlanById("free");
      if (!resolvedPlan) break;

      await updatePlanForUser(
        userId,
        resolvedPlan.id,
        (invoice.subscription as string | null) ?? null,
      );
      await setCreditsForUser(
        userId,
        resolvedPlan.monthlyCredits,
        "subscription_renewal",
        invoice.id,
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserIdFromCustomer(
        subscription.customer as string | null,
      );
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const plan = priceId ? resolvePlanByPriceId(priceId) : undefined;
      if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
        await updatePlanForUser(userId, "free", null);
        break;
      }

      if (plan) {
        await updatePlanForUser(userId, plan.id, subscription.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await resolveUserIdFromCustomer(
        subscription.customer as string | null,
      );
      if (!userId) break;

      await updatePlanForUser(userId, "free", null);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
