import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditTransactions, users } from "@/db/schema";

export const CREDIT_COSTS = {
  styleGeneration: 15,
  characterAsset: 8,
  objectAsset: 8,
  setAsset: 5,
  assetRefinement: 5,
} as const;

export async function checkCredits(userId: string, required: number): Promise<{ ok: boolean; credits: number }> {
  const row = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const credits = row[0]?.credits ?? 0;
  return { ok: credits >= required, credits };
}

export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string,
): Promise<{ credits: number }> {
  if (amount <= 0) throw new Error("amount must be > 0");

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({
        credits: sql`${users.credits} - ${amount}`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(users.id, userId), gte(users.credits, amount)))
      .returning({ credits: users.credits });

    if (!updated.length) throw new Error("Insufficient credits");

    const balanceAfter = updated[0]!.credits;

    await tx.insert(creditTransactions).values({
      userId,
      amount: -Math.abs(amount),
      reason,
      referenceId,
      balanceAfter,
    });

    return { credits: balanceAfter };
  });
}

export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string,
): Promise<{ credits: number }> {
  if (amount <= 0) throw new Error("amount must be > 0");

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({
        credits: sql`${users.credits} + ${amount}`,
        updatedAt: sql`now()`,
      })
      .where(eq(users.id, userId))
      .returning({ credits: users.credits });

    if (!updated.length) throw new Error("User not found");

    const balanceAfter = updated[0]!.credits;

    await tx.insert(creditTransactions).values({
      userId,
      amount: Math.abs(amount),
      reason,
      referenceId,
      balanceAfter,
    });

    return { credits: balanceAfter };
  });
}
