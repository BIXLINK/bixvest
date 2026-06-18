import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/staking")({
  head: () => ({ meta: [{ title: "Admin · Staking — BIXVEST" }] }),
  component: StakingPage,
});

function StakingPage() {
  const qc = useQueryClient();
  const { data: levels = [] } = useQuery({
    queryKey: ["admin-stake-levels"],
    queryFn: async () => (await supabase.from("stake_levels").select("*").order("level")).data ?? [],
  });
  const [edits, setEdits] = useState<Record<number, string>>({});

  useEffect(() => {
    const init: Record<number, string> = {};
    levels.forEach(l => { init[l.level] = String(l.vst_required); });
    setEdits(init);
  }, [levels.length]);

  async function save(level: number) {
    const v = Number(edits[level]);
    if (!Number.isFinite(v) || v < 0) return toast.error("Invalid value");
    const { error } = await supabase.from("stake_levels").update({ vst_required: v }).eq("level", level);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-stake-levels"] });
    qc.invalidateQueries({ queryKey: ["stake-levels"] });
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Staking levels</h1>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {levels.map(l => (
            <div key={l.level} className="grid grid-cols-[60px_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[80px_1fr_200px_auto] sm:px-5">
              <div className="font-display font-semibold">L{l.level}</div>
              <div className="text-sm">{l.name}</div>
              <Input type="number" inputMode="numeric" className="col-span-2 sm:col-span-1" value={edits[l.level] ?? ""} onChange={e => setEdits(s => ({ ...s, [l.level]: e.target.value }))} />
              <Button size="sm" className="col-span-2 sm:col-span-1" onClick={() => save(l.level)}>Save</Button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
