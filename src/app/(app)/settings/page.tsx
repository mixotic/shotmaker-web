import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { creditTransactions, users } from "@/db/schema";
import { SettingsClient } from "@/app/(app)/settings/_components/settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;
  const [user] = await db
    .select({ plan: users.plan, credits: users.credits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const transactions = await db
    .select({
      id: creditTransactions.id,
      amount: creditTransactions.amount,
      reason: creditTransactions.reason,
      referenceId: creditTransactions.referenceId,
      balanceAfter: creditTransactions.balanceAfter,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(10);

  return (
    <SettingsClient
      planId={user?.plan ?? "free"}
      credits={user?.credits ?? 0}
      transactions={transactions}
    />
  );
}
