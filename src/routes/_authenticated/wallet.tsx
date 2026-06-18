import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Wallet as WalletIcon, Lock, TrendingUp, TrendingDown } from "lucide-react";
import { requireActiveOrAdmin } from "@/lib/require-active";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: WalletPage,
});

function fmt(n: number) { return new Intl.NumberFormat("en-US").format(n); }

function WalletPage() {
  const { data: profile } = useProfile();
  const { data: tx = [] } = useQuery({
    queryKey: ["wallet-tx", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase.from("wallet_transactions").select("*").eq("user_id", profile!.id).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">VST Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your VST activity in one place.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-transparent bg-gradient-card p-6 text-white shadow-elegant">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-white/60">Available</div>
              <WalletIcon className="h-4 w-4 text-white/70" />
            </div>
            <div className="mt-3 font-display text-4xl font-bold">{fmt(Number(profile?.vst_balance ?? 0))}</div>
            <div className="mt-1 text-xs text-white/60">VST</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Locked / Staked</div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-4xl font-bold">{fmt(Number(profile?.vst_locked ?? 0))}</div>
            <div className="mt-1 text-xs text-muted-foreground">VST</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4 font-display font-semibold">Transaction history</div>
          {tx.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {tx.map(t => {
                const pos = Number(t.amount) >= 0;
                return (
                  <li key={t.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${pos ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {pos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{t.note || t.type}</div>
                        <div className="text-xs text-muted-foreground capitalize">{t.type.replace("_", " ")} · {new Date(t.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={pos ? "text-success" : "text-destructive"}>
                      {pos ? "+" : ""}{fmt(Number(t.amount))} VST
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
