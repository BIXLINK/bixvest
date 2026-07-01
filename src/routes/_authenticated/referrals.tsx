import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Users, Share2, Layers, Coins } from "lucide-react";
import { toast } from "sonner";
import { requireActiveOrAdmin } from "@/lib/require-active";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data: profile } = useProfile();
  const link = profile?.referral_code
    ? typeof window !== "undefined"
      ? `${window.location.origin}/auth?mode=signup&ref=${profile.referral_code}`
      : ""
    : "";

  // Direct (tier-1) network
  const { data: network = [] } = useQuery({
    queryKey: ["network", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("referrals")
        .select(
          "*, referred:profiles!referrals_referred_id_fkey(full_name, email, membership_status, created_at)",
        )
        .eq("referrer_id", profile!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Multi-tier rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ["referral-rewards", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("referrer_id", profile!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const tier1 = rewards.filter((r: any) => r.tier === 1);
  const tier2 = rewards.filter((r: any) => r.tier === 2);
  const tier3 = rewards.filter((r: any) => r.tier === 3);
  const total = rewards.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const sum = (rs: any[]) => rs.reduce((s, r) => s + Number(r.amount || 0), 0);

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Referral Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn from 3 tiers — direct invites, their invites, and one more level down.
          </p>
        </div>

        <div className="rounded-xl border border-transparent bg-gradient-card p-6 text-white shadow-elegant">
          <div className="text-xs uppercase tracking-wider text-white/60">Your VST Referral ID</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-wider">
            {profile?.referral_code ?? "—"}
          </div>
          <div className="mt-4 flex gap-2">
            <Input readOnly value={link} className="bg-white/10 border-white/20 text-white" />
            <Button variant="secondary" onClick={() => copy(link)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 text-xs text-white/60">
            New members still need an activation code — you're paid across 3 tiers when they activate.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Direct invites" value={network.length} icon={Users} />
          <Stat
            label="Active members"
            value={network.filter((n: any) => n.referred?.membership_status === "active").length}
            icon={Share2}
          />
          <Stat label="Tiers earning" value={[tier1, tier2, tier3].filter((t) => t.length).length} icon={Layers} />
          <Stat label="Total earned (VST)" value={total} icon={Coins} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TierCard tier={1} label="Direct" desc="People you invite" count={tier1.length} vst={sum(tier1)} accent="from-emerald-500/20 to-teal-500/10" />
          <TierCard tier={2} label="Second line" desc="Invited by your invites" count={tier2.length} vst={sum(tier2)} accent="from-sky-500/20 to-indigo-500/10" />
          <TierCard tier={3} label="Third line" desc="One level deeper" count={tier3.length} vst={sum(tier3)} accent="from-fuchsia-500/20 to-purple-500/10" />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4 font-display font-semibold">
            Your direct network
          </div>
          {network.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No referrals yet. Share your link above.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {network.map((n: any) => (
                <li key={n.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <div className="font-medium">
                      {n.referred?.full_name || n.referred?.email || "Member"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`text-xs uppercase tracking-wider ${n.referred?.membership_status === "active" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {n.referred?.membership_status ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {rewards.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4 font-display font-semibold">
              Recent tier payouts
            </div>
            <ul className="divide-y divide-border">
              {rewards.slice(0, 15).map((r: any) => (
                <li key={r.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      T{r.tier}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-success">
                    +{Number(r.amount).toLocaleString()} VST
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}

function TierCard({
  tier,
  label,
  desc,
  count,
  vst,
  accent,
}: {
  tier: number;
  label: string;
  desc: string;
  count: number;
  vst: number;
  accent: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-gradient-to-br ${accent} p-5`}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Tier {tier}</div>
        <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold">{vst.toLocaleString()} VST</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      <div className="mt-3 text-xs">{count} payout{count === 1 ? "" : "s"}</div>
    </div>
  );
}
