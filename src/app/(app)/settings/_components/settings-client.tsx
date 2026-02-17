"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CREDIT_PACKS, PLAN_CATALOG, PlanConfig } from "@/lib/billing";

type CreditTransaction = {
  id: string;
  amount: number;
  reason: string;
  referenceId?: string | null;
  balanceAfter: number;
  createdAt: string | Date;
};

type SettingsClientProps = {
  planId: string;
  credits: number;
  transactions: CreditTransaction[];
};

export function SettingsClient({ planId, credits, transactions }: SettingsClientProps) {
  const { toast } = useToast();
  const [busyPriceId, setBusyPriceId] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  const currentPlan = useMemo(
    () => PLAN_CATALOG.find((plan) => plan.id === planId),
    [planId],
  );

  const creditsCap = currentPlan?.monthlyCredits ?? 50;
  const creditPercent = Math.min(100, Math.round((credits / Math.max(1, creditsCap)) * 100));

  async function startCheckout(priceId: string) {
    try {
      setBusyPriceId(priceId);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "Failed to start checkout");
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyPriceId(null);
    }
  }

  async function openPortal() {
    try {
      setPortalBusy(true);
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "Failed to open portal");
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Portal unavailable",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalBusy(false);
    }
  }

  function renderPlanAction(plan: PlanConfig) {
    if (plan.id === "free") {
      return (
        <Button variant="secondary" disabled>
          Current Plan
        </Button>
      );
    }

    const isCurrent = plan.id === planId;
    const disabled = !plan.priceId || isCurrent || busyPriceId === plan.priceId;
    const label = isCurrent ? "Current Plan" : "Subscribe";

    return (
      <Button
        onClick={() => plan.priceId && startCheckout(plan.priceId)}
        disabled={disabled}
      >
        {busyPriceId === plan.priceId ? "Starting..." : label}
      </Button>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Manage plans, credits, and billing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            {currentPlan?.name ?? "Free"} Plan
          </Badge>
          <Button variant="outline" onClick={openPortal} disabled={portalBusy}>
            {portalBusy ? "Opening..." : "Manage Subscription"}
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Available credits</span>
            <span className="font-semibold text-white">
              {credits} / {creditsCap}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${creditPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Monthly credits reset on your billing cycle. Purchased packs roll over.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_CATALOG.map((plan) => (
            <Card key={plan.id} className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  <span className="text-sm text-slate-400">{plan.priceLabel}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>{plan.description}</p>
                <Separator className="bg-slate-800" />
                <p>
                  <span className="font-semibold text-white">{plan.monthlyCredits}</span>{" "}
                  credits / month
                </p>
                <p>Project limit: {plan.id === "free" ? 1 : plan.id === "starter" ? 5 : "Unlimited"}</p>
              </CardContent>
              <CardFooter>{renderPlanAction(plan)}</CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Credit Packs</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => {
            const disabled = !pack.priceId || busyPriceId === pack.priceId;
            return (
              <Card key={pack.id} className="bg-slate-900/60 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{pack.credits} credits</span>
                    <span className="text-sm text-slate-400">{pack.priceLabel}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                  Add credits instantly. No expiration.
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => pack.priceId && startCheckout(pack.priceId)}
                    disabled={disabled}
                  >
                    {busyPriceId === pack.priceId ? "Starting..." : "Buy Credits"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent Credit Transactions</h2>
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="divide-y divide-slate-800">
            {transactions.length === 0 && (
              <div className="py-6 text-sm text-slate-400">
                No credit activity yet.
              </div>
            )}
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-1 py-4 text-sm text-slate-300 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{tx.reason}</p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(tx.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                  <span className="text-xs text-slate-500">
                    Balance: {tx.balanceAfter}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
