import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Sparkles, Vault, Wallet as WalletIcon, Users, ArrowRight, TrendingUp, Sun, Award, Check } from "lucide-react";
import { Link as TLink } from "@tanstack/react-router";
import { requireActiveOrAdmin } from "@/lib/require-active";
import { completeMission } from "@/lib/bixvest.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: Dashboard,
});

function fmt(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(Number(n ?? 0));
}

function Dashboard() {
  const { data: profile } = useProfile();
  const userId = profile?.id;
  const qc = useQueryClient();
  const complete = useServerFn(completeMission);

  const { data: recentTx = [] } = useQuery({
    queryKey: ["recent-tx", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions").select("*").eq("user_id", userId!)
        .order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: stakeLevels = [] } = useQuery({
    queryKey: ["stake-levels"],
    queryFn: async () => {
      const { data } = await supabase.from("stake_levels").select("*").order("level");
      return data ?? [];
    },
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await (supabase as any).from("user_missions")
        .select("*, onboarding_missions(*)")
        .eq("user_id", userId)
        .order("created_at");
      return data ?? [];
    },
  });

  const nextLevel = stakeLevels.find(l => l.level === (profile?.current_stake_level ?? 0) + 1);
  const progress = nextLevel
    ? Math.min(100, (Number(profile?.vst_balance ?? 0) / Number(nextLevel.vst_required)) * 100)
    : 100;
  const pendingMissions = missions.filter((m: any) => m.status === "pending");

  async function tryMission(id: string) {
    try {
      const r = await complete({ data: { mission_id: id } });
      toast.success(`+${r.awarded} VST`);
      qc.invalidateQueries();
    } catch (e) { toast.error((e as Error).message); }
  }

  // Auto-trigger the verify_email mission once the user has confirmed their email.
  const { user } = useSession();
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current) return;
    if (!user?.email_confirmed_at) return;
    const verifyPending = missions.find(
      (m: any) => m.mission_id === "verify_email" && m.status === "pending",
    );
    if (!verifyPending) return;
    autoTried.current = true;
    complete({ data: { mission_id: "verify_email" } })
      .then((r: any) => {
        if (r?.awarded > 0) toast.success(`Email verified · +${r.awarded} VST`);
        qc.invalidateQueries();
      })
      .catch(() => { autoTried.current = false; });
  }, [user?.email_confirmed_at, missions, complete, qc]);

  const bix = Number((profile as any)?.bix_score ?? 0);
  const bixLevel = Number((profile as any)?.bix_level ?? 1);
  const streak = Number((profile as any)?.current_streak ?? 0);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</div>
            <h1 className="font-display text-3xl font-bold">{profile?.full_name || "Member"}</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/daily" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground inline-flex items-center gap-1">
              <Sun className="h-3 w-3" /> Daily Hub
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="VST Balance" value={fmt(profile?.vst_balance)} icon={WalletIcon} hero />
          <StatCard label="BIX Score" value={`${bix} · L${bixLevel}`} icon={Award} />
          <StatCard label="Streak" value={`${streak} days`} icon={Sun} />
          <StatCard label="Stake Level" value={`L${profile?.current_stake_level ?? 0}`} icon={TrendingUp} />
        </div>

        {pendingMissions.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-primary">Welcome Journey</div>
                <div className="font-display text-xl font-semibold">Complete these to earn VST</div>
              </div>
              <div className="text-xs text-muted-foreground">{missions.length - pendingMissions.length} / {missions.length}</div>
            </div>
            <div className="mt-4 space-y-2">
              {missions.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.status === "completed" ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success/20 text-success">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full border border-dashed border-border" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{m.onboarding_missions?.title}</div>
                      <div className="text-xs text-muted-foreground">{m.onboarding_missions?.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-primary">+{m.onboarding_missions?.reward} VST</div>
                    {m.status === "pending" && (
                      <Button size="sm" onClick={() => tryMission(m.mission_id)}>Claim</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextLevel && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Next vault tier</div>
                <div className="font-display text-xl font-semibold">{nextLevel.name} — {fmt(nextLevel.vst_required)} VST</div>
              </div>
              <Link to="/vault" className="text-sm text-primary hover:underline">Go to Vault <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-emerald" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">{Math.floor(progress)}% toward {nextLevel.name}</div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <ActionCard to="/rewards" title="Rewards Hub" desc="Tasks, campaigns, and challenges." icon={Sparkles} />
          <ActionCard to="/daily" title="Daily Hub" desc="Stack login, learning & community bonuses." icon={Sun} />
          <ActionCard to="/referrals" title="Invite" desc={`Your code: ${profile?.referral_code ?? "—"}`} icon={Users} />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="font-display font-semibold">Recent activity</div>
            <Link to="/wallet" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No activity yet. Start with the Daily Hub.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentTx.map(t => (
                <li key={t.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <div className="font-medium">{t.note || t.type}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div className={Number(t.amount) >= 0 ? "text-success" : "text-destructive"}>
                    {Number(t.amount) >= 0 ? "+" : ""}{fmt(t.amount)} VST
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, icon: Icon, hero }: { label: string; value: string; icon: any; hero?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${hero ? "border-transparent bg-gradient-card text-white shadow-elegant" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs uppercase tracking-wider ${hero ? "text-white/60" : "text-muted-foreground"}`}>{label}</div>
        <Icon className={`h-4 w-4 ${hero ? "text-white/70" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function ActionCard({ to, title, desc, icon: Icon }: { to: string; title: string; desc: string; icon: any }) {
  return (
    <TLink to={to} className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-elegant">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent"><Icon className="h-5 w-5 text-primary" /></div>
        <div>
          <div className="font-display font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </TLink>
  );
}
