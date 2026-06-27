import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — BIXVEST" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { data: rows = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Last 200 admin actions, newest first.</p>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Target</th>
                <th className="px-3 py-2 text-left">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No actions yet.
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {r.actor_id?.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.action}</td>
                    <td className="px-3 py-2 text-xs">
                      {r.target_type ?? "—"}
                      {r.target_id ? `:${String(r.target_id).slice(0, 8)}` : ""}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <code className="text-[10px]">{JSON.stringify(r.payload)}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
