import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { useProfile } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Layers, TrendingUp, Clock, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { requireActiveOrAdmin } from "@/lib/require-active";
import {
  stakeIntoPool,
  claimStakeRewards,
  emergencyUnstake,
  completeStake,
} from "@/lib/bixvest.functions";

export const Route = createFileRoute("/_authenticated/staking")({
  head: () => ({
    meta: [
      { title: "Staking — BIXVEST" },
      { name: "description", content: "Premium staking pools with daily, weekly and monthly rewards on BIXVEST." },
    ],
  }),
  beforeLoad: requireActiveOrAdmin,
  component: StakingHub,
});

function fmt(n: number, d = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(n);
}

function calcReward(p: number, apy: number, days: number) {
  return (p * (apy / 100) * days) / 365;
}

function StakingHub() {
  const { data: profile } = useProfile();

  const { data: pools = [] } = useQuery({
    queryKey: ["staking-pools"],
    queryFn: async () =>
      (
        await supabase
          .from("staking_pools")
          .select("*")
          .eq("status", "active")
          .order("lock_days", { ascending: true })
      ).data ?? [],
  });

  const { data: stakes = [] } = useQuery({
    queryKey: ["my-stakes-v2"],
    queryFn: async () =>
      (
        await supabase
          .from("user_stakes_v2")
          .select("*, staking_pools(*)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const active = stakes.filter((s: any) => ["active", "rewarding", "claimable"].includes(s.status));
  const totals = useMemo(() => {
    const totalStaked = active.reduce((s: number, x: any) => s + Number(x.principal), 0);
    const rewardsEarned = stakes.reduce((s: number, x: any) => s + Number(x.rewards_claimed || 0), 0);
    let pending = 0;
    let avgApy = 0;
    for (const s of active) {
      const pool = s.staking_pools;
      const since = new Date(s.last_reward_at ?? s.started_at).getTime();
      const days = Math.max(0, (Date.now() - since) / 86400_000);
      pending += calcReward(Number(s.principal), Number(pool?.apy ?? 0), days);
      avgApy += Number(pool?.apy ?? 0) * Number(s.principal);
    }
    avgApy = totalStaked > 0 ? avgApy / totalStaked : 0;
    return { totalStaked, rewardsEarned, pending, avgApy };
  }, [stakes, active]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Staking</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stake VST into flexible or locked pools. Rewards stream daily and are fully ledger-tracked.
            </p>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total Staked" value={`${fmt(totals.totalStaked)} VST`} icon={Layers} />
          <Stat label="Estimated APY" value={`${fmt(totals.avgApy)}%`} icon={TrendingUp} />
          <Stat label="Rewards Earned" value={`${fmt(totals.rewardsEarned)} VST`} icon={Sparkles} />
          <Stat label="Pending Rewards" value={`${fmt(totals.pending)} VST`} icon={Clock} />
        </div>

        <Tabs defaultValue="pools" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pools">Pools</TabsTrigger>
            <TabsTrigger value="active">Active Stakes ({active.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pools" className="mt-6">
            <PoolGrid pools={pools} balance={Number(profile?.vst_balance ?? 0)} />
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <ActiveStakes stakes={active} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Analytics stakes={stakes} totals={totals} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryList stakes={stakes} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function PoolGrid({ pools, balance }: { pools: any[]; balance: number }) {
  if (pools.length === 0)
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No pools available right now.
      </div>
    );
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {pools.map((p) => (
        <PoolCard key={p.id} pool={p} balance={balance} />
      ))}
    </div>
  );
}

function PoolCard({ pool, balance }: { pool: any; balance: number }) {
  const qc = useQueryClient();
  const stake = useServerFn(stakeIntoPool);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [auto, setAuto] = useState(false);

  const amt = Number(amount || 0);
  const days = Number(pool.lock_days) || 30;
  const apy = Number(pool.apy);
  const projDaily = calcReward(amt, apy, 1);
  const projWeekly = calcReward(amt, apy, 7);
  const projMonthly = calcReward(amt, apy, 30);
  const projFinal = calcReward(amt, apy, days);
  const cap = Number(pool.capacity || 0);
  const used = Number(pool.capacity_used || 0);
  const capPct = cap ? Math.min(100, (used / cap) * 100) : 0;

  const m = useMutation({
    mutationFn: () => stake({ data: { pool_id: pool.id, amount: amt, auto_compound: auto } }),
    onSuccess: () => {
      toast.success(`Staked ${fmt(amt)} VST in ${pool.name}`);
      setOpen(false);
      setAmount("");
      qc.invalidateQueries({ queryKey: ["my-stakes-v2"] });
      qc.invalidateQueries({ queryKey: ["staking-pools"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const riskLabel = days === 0 ? "Low" : days >= 180 ? "High" : "Medium";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg font-bold">{pool.name}</div>
          <div className="text-xs text-muted-foreground">
            {days === 0 ? "Flexible" : `${days}-day lock`} · {pool.reward_frequency ?? "daily"} rewards
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-primary">{fmt(apy)}%</div>
          <div className="text-[10px] uppercase text-muted-foreground">APY</div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-y-2 text-xs">
        <dt className="text-muted-foreground">Min stake</dt>
        <dd className="text-right font-medium">{fmt(Number(pool.min_stake))} VST</dd>
        <dt className="text-muted-foreground">Max stake</dt>
        <dd className="text-right font-medium">{pool.max_stake ? `${fmt(Number(pool.max_stake))} VST` : "—"}</dd>
        <dt className="text-muted-foreground">Risk</dt>
        <dd className="text-right font-medium">{riskLabel}</dd>
        <dt className="text-muted-foreground">Auto-compound</dt>
        <dd className="text-right font-medium">{pool.auto_compound_supported ? "Supported" : "—"}</dd>
      </dl>

      {cap > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Capacity</span>
            <span>{fmt(capPct, 0)}%</span>
          </div>
          <Progress value={capPct} className="mt-1 h-1.5" />
        </div>
      )}

      {!open ? (
        <Button className="mt-5 w-full" onClick={() => setOpen(true)}>
          Stake VST
        </Button>
      ) : (
        <div className="mt-5 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${pool.min_stake}`}
            />
            <div className="mt-1 text-[10px] text-muted-foreground">Available: {fmt(balance)} VST</div>
          </div>
          {pool.auto_compound_supported && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-xs">
              <span>Auto-compound rewards</span>
              <Switch checked={auto} onCheckedChange={setAuto} />
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-3 text-[11px]">
            <div className="mb-1 text-muted-foreground">Live reward simulation</div>
            <div className="grid grid-cols-2 gap-y-1">
              <span>Daily</span>
              <span className="text-right font-medium text-success">+{fmt(projDaily, 4)} VST</span>
              <span>Weekly</span>
              <span className="text-right font-medium text-success">+{fmt(projWeekly, 3)} VST</span>
              <span>Monthly</span>
              <span className="text-right font-medium text-success">+{fmt(projMonthly, 2)} VST</span>
              <span>At maturity</span>
              <span className="text-right font-medium text-success">+{fmt(projFinal, 2)} VST</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={amt < Number(pool.min_stake) || amt > balance || m.isPending}
              onClick={() => m.mutate()}
            >
              {m.isPending ? "Staking..." : "Confirm"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveStakes({ stakes }: { stakes: any[] }) {
  if (stakes.length === 0)
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        You don't have any active stakes yet. Choose a pool to get started.
      </div>
    );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {stakes.map((s) => <StakeCard key={s.id} stake={s} />)}
    </div>
  );
}

function StakeCard({ stake }: { stake: any }) {
  const qc = useQueryClient();
  const pool = stake.staking_pools;
  const claim = useServerFn(claimStakeRewards);
  const emergency = useServerFn(emergencyUnstake);
  const complete = useServerFn(completeStake);

  const since = new Date(stake.last_reward_at ?? stake.started_at).getTime();
  const elapsed = (Date.now() - since) / 86400_000;
  const pending = calcReward(Number(stake.principal), Number(pool?.apy ?? 0), elapsed);

  const start = new Date(stake.started_at).getTime();
  const unlock = stake.unlock_at ? new Date(stake.unlock_at).getTime() : null;
  const progress = unlock ? Math.min(100, ((Date.now() - start) / (unlock - start)) * 100) : 100;
  const matured = !unlock || Date.now() >= unlock;

  const cM = useMutation({
    mutationFn: () => claim({ data: { stake_id: stake.id } }),
    onSuccess: (r: any) => {
      toast.success(`Claimed ${fmt(r.reward)} VST`);
      qc.invalidateQueries({ queryKey: ["my-stakes-v2"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const eM = useMutation({
    mutationFn: () => emergency({ data: { stake_id: stake.id } }),
    onSuccess: (r: any) => {
      toast.success(`Returned ${fmt(r.net)} VST (penalty ${fmt(r.penalty)} VST)`);
      qc.invalidateQueries({ queryKey: ["my-stakes-v2"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const compM = useMutation({
    mutationFn: () => complete({ data: { stake_id: stake.id } }),
    onSuccess: () => {
      toast.success("Stake completed");
      qc.invalidateQueries({ queryKey: ["my-stakes-v2"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remaining = unlock ? Math.max(0, unlock - Date.now()) : 0;
  const remDays = Math.floor(remaining / 86400_000);
  const remHours = Math.floor((remaining % 86400_000) / 3600_000);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg font-bold">{pool?.name}</div>
          <div className="text-xs text-muted-foreground">
            {fmt(Number(pool?.apy ?? 0))}% APY · started {new Date(stake.started_at).toLocaleDateString()}
          </div>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
          {stake.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Mini label="Staked" value={`${fmt(Number(stake.principal))}`} />
        <Mini label="Earned" value={`${fmt(Number(stake.rewards_claimed))}`} accent="text-success" />
        <Mini label="Pending" value={`${fmt(pending)}`} accent="text-amber-500" />
      </div>

      {unlock && (
        <>
          <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Lock progress</span>
            <span>{matured ? "Matured" : `${remDays}d ${remHours}h left`}</span>
          </div>
          <Progress value={progress} className="mt-1 h-1.5" />
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => cM.mutate()} disabled={cM.isPending || pending < 0.01}>
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Claim rewards
        </Button>
        {matured ? (
          <Button size="sm" variant="outline" onClick={() => compM.mutate()} disabled={compM.isPending}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Withdraw principal
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (
                confirm(
                  `Emergency unstake? You'll pay a ${pool?.emergency_penalty_pct ?? 10}% penalty (${fmt(
                    (Number(stake.principal) * Number(pool?.emergency_penalty_pct ?? 10)) / 100,
                  )} VST).`,
                )
              )
                eM.mutate();
            }}
            disabled={eM.isPending}
          >
            <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Emergency unstake
          </Button>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-base font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function Analytics({ stakes, totals }: { stakes: any[]; totals: any }) {
  // Build per-pool allocation
  const byPool = new Map<string, number>();
  for (const s of stakes.filter((x) => ["active", "rewarding", "claimable"].includes(x.status))) {
    const k = s.staking_pools?.name ?? "Unknown";
    byPool.set(k, (byPool.get(k) ?? 0) + Number(s.principal));
  }
  const alloc = Array.from(byPool.entries()).map(([k, v]) => ({
    label: k,
    value: v,
    pct: totals.totalStaked ? (v / totals.totalStaked) * 100 : 0,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold">Portfolio allocation</h3>
        {alloc.length === 0 ? (
          <div className="mt-6 text-sm text-muted-foreground">No active stakes.</div>
        ) : (
          <ul className="mt-5 space-y-3">
            {alloc.map((a) => (
              <li key={a.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{a.label}</span>
                  <span className="font-medium">{fmt(a.value)} VST ({fmt(a.pct, 1)}%)</span>
                </div>
                <Progress value={a.pct} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold">Summary</h3>
        <dl className="mt-5 space-y-3 text-sm">
          <Row k="Total stakes" v={String(stakes.length)} />
          <Row k="Active" v={String(stakes.filter((s) => s.status === "active").length)} />
          <Row k="Completed" v={String(stakes.filter((s) => s.status === "completed").length)} />
          <Row k="Total earned" v={`${fmt(totals.rewardsEarned)} VST`} />
          <Row k="Average APY" v={`${fmt(totals.avgApy)}%`} />
        </dl>
      </div>
    </div>
  );
}

function HistoryList({ stakes }: { stakes: any[] }) {
  if (stakes.length === 0)
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No staking history yet.
      </div>
    );
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        {stakes.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-6 py-3 text-sm">
            <div>
              <div className="font-medium">{s.staking_pools?.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString()} · {s.status}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{fmt(Number(s.principal))} VST</div>
              <div className="text-xs text-success">+{fmt(Number(s.rewards_claimed))} earned</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
