import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createCustomerPortalSession, getOrCreateCustomer } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const [user] = await db
    .select({ email: users.email, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const customerId =
    user.stripeCustomerId ?? (await getOrCreateCustomer(userId, user.email));
  const portal = await createCustomerPortalSession(customerId);
  if (!portal.url) {
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: portal.url });
}
