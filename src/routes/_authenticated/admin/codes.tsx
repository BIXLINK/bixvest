import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateActivationCodes, disableActivationCode } from "@/lib/bixvest.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Ban } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/codes")({
  head: () => ({ meta: [{ title: "Admin · Activation Codes — BIXVEST" }] }),
  component: CodesPage,
});

function CodesPage() {
  const qc = useQueryClient();
  const generate = useServerFn(generateActivationCodes);
  const disable = useServerFn(disableActivationCode);
  const [count, setCount] = useState("10");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: codes = [] } = useQuery({
    queryKey: ["activation-codes"],
    queryFn: async () =>
      (
        await supabase
          .from("activation_codes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  async function gen() {
    setBusy(true);
    try {
      await generate({ data: { count: Number(count), assigned_email: email || null } });
      toast.success(`${count} codes generated`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["activation-codes"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Activation Codes</h1>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="font-display font-semibold mb-3">Generate codes</div>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Count</Label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min={1}
                max={500}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assign to email (optional)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={gen} disabled={busy}>
                {busy ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Assigned email</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {codes.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.assigned_email || "Any"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs uppercase tracking-wider ${c.status === "used" ? "text-success" : c.status === "disabled" ? "text-destructive" : "text-warning"}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {c.status === "unused" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await disable({ data: { id: c.id } });
                            toast.success("Disabled");
                            qc.invalidateQueries({ queryKey: ["activation-codes"] });
                          } catch (err) {
                            toast.error((err as Error).message);
                          }
                        }}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
