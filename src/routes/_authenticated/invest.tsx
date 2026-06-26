import { createFileRoute } from "@tanstack/react-router";
import { requireActiveOrAdmin } from "@/lib/require-active";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { TrendingUp, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invest")({
  head: () => ({ meta: [{ title: "BIXVEST Invest — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: InvestPage,
});

function InvestPage() {
  const { data: profile } = useProfile();
  const userId = profile?.id;

  const { data: wallet } = useQuery({
    queryKey: ["invest-wallet", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await (supabase as any).from("invest_wallet")
        .select("*").eq("user_id", userId).maybeSingle();
      return data ?? { balance: 0, locked: 0, currency: "USD" };
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["invest-products-active"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("invest_products")
        .select("*").eq("status", "active").order("apr", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">BIXVEST</div>
          <h1 className="font-display text-3xl font-bold">Invest</h1>
          <p className="text-sm text-muted-foreground">A separate investment layer. Independent of your VST rewards wallet.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-transparent bg-gradient-card p-6 text-white shadow-elegant">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
              <TrendingUp className="h-4 w-4" /> Investment Wallet
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{Number(wallet?.balance ?? 0).toFixed(2)} {wallet?.currency ?? "USD"}</div>
            <div className="mt-1 text-xs text-white/70">Locked: {Number(wallet?.locked ?? 0).toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Lock className="h-4 w-4" /> Status
            </div>
            <div className="mt-3 font-display text-xl font-semibold">Coming Soon</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Verified investment products are launching shortly. Your investment activity is tracked separately
              from your VST rewards to keep everything transparent.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Available Products</div>
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No investment products are live yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="font-display text-lg font-semibold">{p.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">Min: {Number(p.min_amount).toFixed(2)}</div>
                    <div className="font-semibold text-primary">{Number(p.apr).toFixed(2)}% APR</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
