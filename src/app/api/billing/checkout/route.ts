import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { CREDIT_PACKS, PLAN_CATALOG, resolveCreditPackByPriceId, resolvePlanByPriceId } from "@/lib/billing";

const RequestSchema = z.object({
  priceId: z.string().min(1),
});

function resolveCheckoutMode(priceId: string): "payment" | "subscription" | null {
  if (resolvePlanByPriceId(priceId)) return "subscription";
  if (resolveCreditPackByPriceId(priceId)) return "payment";
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { priceId } = parsed.data;
  const mode = resolveCheckoutMode(priceId);
  if (!mode) {
    const allowed = [
      ...PLAN_CATALOG.map((plan) => plan.priceId).filter(Boolean),
      ...CREDIT_PACKS.map((pack) => pack.priceId).filter(Boolean),
    ];
    return NextResponse.json(
      { error: "Unknown priceId", allowed },
      { status: 400 },
    );
  }

  const userId = (session.user as any).id as string;
  const sessionResult = await createCheckoutSession(userId, priceId, mode);
  if (!sessionResult.url) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: sessionResult.url });
}
