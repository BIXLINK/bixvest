import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Sparkles, Vault, Wallet as WalletIcon, Users, ArrowRight, TrendingUp } from "lucide-react";
import { Link as TLink } from "@tanstack/react-router";
import { requireActiveOrAdmin } from "@/lib/require-active";

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

  const { data: recentTx = [] } = useQuery({
    queryKey: ["recent-tx", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions").select("*").eq("user_id", userId!)
        .order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
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

  const nextLevel = stakeLevels.find(l => l.level === (profile?.current_stake_level ?? 0) + 1);
  const progress = nextLevel
    ? Math.min(100, (Number(profile?.vst_balance ?? 0) / Number(nextLevel.vst_required)) * 100)
    : 100;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</div>
          <h1 className="font-display text-3xl font-bold">{profile?.full_name || "Member"}</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="VST Balance" value={fmt(profile?.vst_balance)} icon={WalletIcon} hero />
          <StatCard label="Locked (Staked)" value={fmt(profile?.vst_locked)} icon={Vault} />
          <StatCard label="Stake Level" value={`L${profile?.current_stake_level ?? 0}`} icon={TrendingUp} />
          <StatCard label="Membership" value={profile?.membership_status?.toUpperCase() ?? "—"} icon={Sparkles} />
        </div>

        {nextLevel && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Next level</div>
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
          <ActionCard to="/rewards" title="Rewards Hub" desc="Earn VST through tasks, campaigns, and challenges." icon={Sparkles} />
          <ActionCard to="/vault" title="Open Vault" desc="Stake VST into progressive growth levels." icon={Vault} />
          <ActionCard to="/referrals" title="Invite" desc={`Your code: ${profile?.referral_code ?? "—"}`} icon={Users} />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="font-display font-semibold">Recent activity</div>
            <Link to="/wallet" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No activity yet. Start with a task in the Rewards Hub.</div>
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
