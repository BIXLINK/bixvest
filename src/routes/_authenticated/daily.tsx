import { createFileRoute } from "@tanstack/react-router";
import { requireActiveOrAdmin } from "@/lib/require-active";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { claimDaily } from "@/lib/bixvest.functions";
import { Button } from "@/components/ui/button";
import { Sun, BookOpen, Users as UsersIcon, Flame, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/daily")({
  head: () => ({ meta: [{ title: "Daily Hub — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: DailyPage,
});

function DailyPage() {
  const { data: profile } = useProfile();
  const userId = profile?.id;
  const qc = useQueryClient();
  const claim = useServerFn(claimDaily);

  const today = new Date().toISOString().slice(0, 10);
  const { data: claims = [] } = useQuery({
    queryKey: ["daily-claims", userId, today],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("daily_claims")
        .select("claim_type")
        .eq("user_id", userId)
        .eq("claim_date", today);
      return data ?? [];
    },
  });
  const claimed = new Set(claims.map((c: any) => c.claim_type));

  const { data: cfg = [] } = useQuery({
    queryKey: ["app-config-daily"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("app_config")
        .select("key, value")
        .in("key", ["daily_login_reward", "daily_learning_reward", "daily_community_reward"]);
      return data ?? [];
    },
  });
  const amt = (k: string, d: number) => Number(cfg.find((r: any) => r.key === k)?.value ?? d);

  async function run(type: "login" | "learning" | "community") {
    try {
      const r = await claim({ data: { type } });
      toast.success(`+${r.amount} VST claimed`);
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const streak = (profile as any)?.current_streak ?? 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Today's Opportunities</h1>
            <p className="text-sm text-muted-foreground">
              Show up daily. Stack VST. Build your BIX Score.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold">{streak}-day streak</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DailyCard
            icon={Sun}
            title="Login Bonus"
            desc="Show up. Get rewarded."
            amount={amt("daily_login_reward", 50)}
            claimed={claimed.has("login")}
            onClaim={() => run("login")}
          />
          <DailyCard
            icon={BookOpen}
            title="Learning Task"
            desc="Read or watch BIXVEST content."
            amount={amt("daily_learning_reward", 100)}
            claimed={claimed.has("learning")}
            onClaim={() => run("learning")}
          />
          <DailyCard
            icon={UsersIcon}
            title="Community Task"
            desc="Engage with the community."
            amount={amt("daily_community_reward", 200)}
            claimed={claimed.has("community")}
            onClaim={() => run("community")}
          />
        </div>

        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Featured campaigns appear in the{" "}
          <a href="/rewards" className="text-primary underline">
            Rewards Hub
          </a>
          .
        </div>
      </div>
    </AppLayout>
  );
}

function DailyCard({ icon: Icon, title, desc, amount, claimed, onClaim }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-3 font-display text-lg font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-medium text-primary">+{amount} VST</div>
        {claimed ? (
          <Button size="sm" variant="secondary" disabled>
            <Check className="mr-1 h-3 w-3" /> Claimed
          </Button>
        ) : (
          <Button size="sm" onClick={onClaim}>
            Claim
          </Button>
        )}
      </div>
    </div>
  );
}
