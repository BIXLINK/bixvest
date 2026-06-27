import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { setAppConfig } from "@/lib/bixvest.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin/rewards")({
  head: () => ({ meta: [{ title: "Reward Management — BIXVEST" }] }),
  component: RewardsAdmin,
});

const NUMERIC_KEYS = [
  "daily_login_reward",
  "daily_learning_reward",
  "daily_community_reward",
  "referral_reward",
];
const JSON_KEYS = ["mission_rewards", "bix_score_weights"];

function RewardsAdmin() {
  const qc = useQueryClient();
  const set = useServerFn(setAppConfig);

  const { data: configs = [] } = useQuery({
    queryKey: ["app-config-all"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("app_config").select("*");
      return data ?? [];
    },
  });

  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    configs.forEach((c: any) => {
      next[c.key] =
        typeof c.value === "object" ? JSON.stringify(c.value, null, 2) : String(c.value);
    });
    setValues(next);
  }, [configs]);

  async function save(key: string) {
    try {
      const raw = values[key];
      const parsed = JSON_KEYS.includes(key) ? JSON.parse(raw) : Number(raw);
      await set({ data: { key, value: parsed } });
      toast.success(`${key} updated`);
      qc.invalidateQueries({ queryKey: ["app-config-all"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Reward Management</h1>
          <p className="text-sm text-muted-foreground">
            Adjust daily bonuses, mission rewards, and BIX scoring weights.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="font-display font-semibold mb-3">Daily &amp; Referral Rewards</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {NUMERIC_KEYS.map((k) => (
              <div key={k}>
                <label className="text-xs text-muted-foreground">{k.replace(/_/g, " ")}</label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={values[k] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                  />
                  <Button size="sm" onClick={() => save(k)}>
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="font-display font-semibold mb-3">
            Mission Rewards &amp; BIX Weights (JSON)
          </div>
          {JSON_KEYS.map((k) => (
            <div key={k} className="mb-4">
              <label className="text-xs text-muted-foreground">{k}</label>
              <textarea
                rows={5}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
                value={values[k] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
              />
              <Button size="sm" className="mt-2" onClick={() => save(k)}>
                Save {k}
              </Button>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
