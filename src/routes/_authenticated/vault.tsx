import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { stakeVst } from "@/lib/bixvest.functions";
import { Button } from "@/components/ui/button";
import { Vault, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { requireActiveOrAdmin } from "@/lib/require-active";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "VST Vault — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: VaultPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function VaultPage() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const stake = useServerFn(stakeVst);
  const [busy, setBusy] = useState<number | null>(null);

  const { data: levels = [] } = useQuery({
    queryKey: ["stake-levels"],
    queryFn: async () =>
      (await supabase.from("stake_levels").select("*").order("level")).data ?? [],
  });
  const { data: stakes = [] } = useQuery({
    queryKey: ["stakes", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () =>
      (
        await supabase
          .from("stakes")
          .select("*")
          .eq("user_id", profile!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  async function doStake(level: number) {
    setBusy(level);
    try {
      await stake({ data: { level } });
      toast.success(`Staked into Tier ${level}`);
      qc.invalidateQueries();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const currentLevel = profile?.current_stake_level ?? 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">VST Vault</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stake VST into progressive growth levels.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Available VST" value={fmt(Number(profile?.vst_balance ?? 0))} />
          <Stat label="Locked VST" value={fmt(Number(profile?.vst_locked ?? 0))} hero />
          <Stat label="Current level" value={`L${currentLevel}`} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {levels.map((lvl) => {
            const achieved = currentLevel >= lvl.level;
            const next = currentLevel + 1 === lvl.level;
            return (
              <div
                key={lvl.level}
                className={`rounded-xl border p-5 ${achieved ? "border-primary/40 bg-gradient-card text-white" : next ? "border-primary/30 bg-card" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <Vault
                    className={`h-4 w-4 ${achieved ? "text-white/70" : "text-muted-foreground"}`}
                  />
                  {achieved && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div
                  className={`mt-3 text-xs uppercase tracking-wider ${achieved ? "text-white/60" : "text-muted-foreground"}`}
                >
                  Level {lvl.level}
                </div>
                <div className="font-display text-xl font-bold">{lvl.name}</div>
                <div
                  className={`mt-1 text-sm ${achieved ? "text-white/80" : "text-muted-foreground"}`}
                >
                  {fmt(Number(lvl.vst_required))} VST
                </div>
                <div className="mt-4">
                  {achieved ? (
                    <div className="text-xs text-white/70 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Staked
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!next || busy === lvl.level}
                      onClick={() => doStake(lvl.level)}
                    >
                      {busy === lvl.level ? "Staking..." : next ? "Stake" : "Locked"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4 font-display font-semibold">
            Stake history
          </div>
          {stakes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No stakes yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {stakes.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <div className="font-medium">Tier {s.level}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-medium">{fmt(Number(s.amount))} VST</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 ${hero ? "border-transparent bg-gradient-emerald text-primary-foreground shadow-glow" : "border-border bg-card"}`}
    >
      <div
        className={`text-xs uppercase tracking-wider ${hero ? "text-white/70" : "text-muted-foreground"}`}
      >
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
