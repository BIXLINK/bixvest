import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/economy")({
  head: () => ({ meta: [{ title: "Economy — BIXVEST" }] }),
  component: EconomyPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function EconomyPage() {
  const { data } = useQuery({
    queryKey: ["economy"],
    queryFn: async () => {
      const [{ data: prof }, { data: tx }, { data: levels }] = await Promise.all([
        (supabase as any).from("profiles").select("vst_balance, vst_locked"),
        (supabase as any).from("wallet_transactions").select("type, amount"),
        (supabase as any).from("stake_levels").select("*").order("level"),
      ]);
      const supply = (prof ?? []).reduce(
        (s: number, r: any) => s + Number(r.vst_balance) + Number(r.vst_locked),
        0,
      );
      const staked = (prof ?? []).reduce((s: number, r: any) => s + Number(r.vst_locked), 0);
      const byType: Record<string, number> = {};
      (tx ?? []).forEach((r: any) => {
        byType[r.type] = (byType[r.type] ?? 0) + Math.abs(Number(r.amount));
      });
      return { supply, staked, byType, levels: levels ?? [] };
    },
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Economy Control</h1>
          <p className="text-sm text-muted-foreground">
            VST supply, distribution, and staking economics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total VST Supply" value={fmt(data?.supply ?? 0)} />
          <Stat label="Locked in Vault" value={fmt(data?.staked ?? 0)} />
          <Stat label="Circulating" value={fmt((data?.supply ?? 0) - (data?.staked ?? 0))} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="font-display font-semibold mb-4">Volume by Type</div>
          <div className="space-y-2">
            {Object.entries(data?.byType ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="capitalize">{k}</span>
                <span className="font-medium">{fmt(v as number)} VST</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="font-display font-semibold mb-4">Staking Tiers</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(data?.levels ?? []).map((l: any) => (
              <div
                key={l.level}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  L{l.level} · {l.name}
                </span>
                <span className="font-medium">{fmt(Number(l.vst_required))} VST</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Edit tier values in the Staking tab.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
