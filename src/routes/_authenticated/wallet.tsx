import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Wallet as WalletIcon, Lock, TrendingUp, TrendingDown, ArrowDown, ArrowUp, Coins } from "lucide-react";
import { requireActiveOrAdmin } from "@/lib/require-active";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: WalletPage,
});

function fmt(n: number) { return new Intl.NumberFormat("en-US").format(n); }

const FILTERS: { id: string; label: string; types: string[] | null }[] = [
  { id: "all", label: "All", types: null },
  { id: "rewards", label: "Rewards", types: ["earn", "daily", "mission", "campaign", "task"] },
  { id: "referral", label: "Referral", types: ["referral"] },
  { id: "staking", label: "Staking", types: ["stake_lock", "stake_unlock", "stake"] },
  { id: "admin", label: "Admin", types: ["admin_adjust", "adjustment", "bonus"] },
  { id: "spend", label: "Spend", types: ["spend", "purchase"] },
];

function WalletPage() {
  const { data: profile } = useProfile();
  const [filter, setFilter] = useState("all");

  const { data: tx = [] } = useQuery({
    queryKey: ["wallet-tx", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => (await supabase
      .from("wallet_transactions").select("*").eq("user_id", profile!.id)
      .order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const totals = useMemo(() => {
    let earned = 0, spent = 0, pending = 0;
    for (const t of tx) {
      const a = Number(t.amount);
      if (t.status === "pending") pending += Math.abs(a);
      if (a >= 0) earned += a; else spent += Math.abs(a);
    }
    return { earned, spent, pending };
  }, [tx]);

  const active = FILTERS.find(f => f.id === filter)!;
  const filtered = useMemo(() => {
    if (!active.types) return tx;
    return tx.filter(t => active.types!.includes(t.type));
  }, [tx, active]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">VST Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every movement is recorded in the BIXVEST ledger.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-transparent bg-gradient-card p-6 text-white shadow-elegant">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-white/60">Available</div>
              <WalletIcon className="h-4 w-4 text-white/70" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{fmt(Number(profile?.vst_balance ?? 0))}</div>
            <div className="mt-1 text-xs text-white/60">VST</div>
          </div>
          <Stat label="Locked / Staked" value={fmt(Number(profile?.vst_locked ?? 0))} icon={Lock} />
          <Stat label="Total Earned" value={fmt(totals.earned)} icon={ArrowDown} accent="text-success" />
          <Stat label="Total Spent" value={fmt(totals.spent)} icon={ArrowUp} accent="text-destructive" />
        </div>

        {totals.pending > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <Coins className="inline h-4 w-4 mr-2 text-amber-500" />
            {fmt(totals.pending)} VST pending review across submissions.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-6 py-4 font-display font-semibold flex items-center justify-between">
            <span>Transaction history</span>
            <span className="text-xs text-muted-foreground font-normal">{filtered.length} entries</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No transactions for this filter.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(t => {
                const pos = Number(t.amount) >= 0;
                return (
                  <li key={t.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pos ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {pos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{t.note || t.type}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {t.type.replace(/_/g, " ")} · {new Date(t.created_at).toLocaleString()}
                          {t.status && t.status !== "confirmed" ? ` · ${t.status}` : ""}
                        </div>
                        <div className="text-[10px] text-muted-foreground/70 font-mono">#{String(t.id).slice(0, 8)}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={pos ? "text-success font-medium" : "text-destructive font-medium"}>
                        {pos ? "+" : ""}{fmt(Number(t.amount))} VST
                      </div>
                      <div className="text-[10px] text-muted-foreground">bal {fmt(Number(t.balance_after))}</div>
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

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">VST</div>
    </div>
  );
}
