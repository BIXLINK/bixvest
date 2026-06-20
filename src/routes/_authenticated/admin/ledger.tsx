import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminLayout } from "@/components/admin-layout";
import { getLedgerPage } from "@/lib/bixvest.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/ledger")({
  head: () => ({ meta: [{ title: "Ledger Explorer — BIXVEST" }] }),
  component: LedgerPage,
});

function fmt(n: number) { return new Intl.NumberFormat("en-US").format(n); }

function LedgerPage() {
  const fetchLedger = useServerFn(getLedgerPage);
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ledger", userId, type, offset],
    queryFn: () => fetchLedger({ data: { user_id: userId || undefined, type: type || undefined, limit, offset } }),
  });

  function exportCsv() {
    const rows = data?.rows ?? [];
    const header = "id,user_id,type,amount,balance_after,source,destination,note,created_at";
    const csv = [header, ...rows.map((r: any) =>
      [r.id, r.user_id, r.type, r.amount, r.balance_after, r.source, r.destination, JSON.stringify(r.note ?? ""), r.created_at].join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ledger-${Date.now()}.csv`;
    a.click();
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Ledger Explorer</h1>
          <p className="text-sm text-muted-foreground">Every VST movement, system-wide.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">User ID</label>
            <Input value={userId} onChange={e => setUserId(e.target.value)} placeholder="uuid (optional)" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground">Type</label>
            <Input value={type} onChange={e => setType(e.target.value)} placeholder="earn, stake, daily…" />
          </div>
          <Button onClick={() => { setOffset(0); refetch(); }}>Filter</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-left">Source → Dest</th>
                <th className="px-3 py-2 text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              ) : (data?.rows ?? []).length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No entries.</td></tr>
              ) : data!.rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{r.profiles?.full_name || r.user_id.slice(0, 8)}</td>
                  <td className="px-3 py-2"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.type}</span></td>
                  <td className={`px-3 py-2 text-right font-medium ${Number(r.amount) >= 0 ? "text-success" : "text-destructive"}`}>
                    {Number(r.amount) >= 0 ? "+" : ""}{fmt(r.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">{fmt(r.balance_after)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.source} → {r.destination}</td>
                  <td className="px-3 py-2 text-xs">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Total: {data?.total ?? 0}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</Button>
            <Button variant="outline" size="sm" disabled={(data?.rows?.length ?? 0) < limit} onClick={() => setOffset(offset + limit)}>Next</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
