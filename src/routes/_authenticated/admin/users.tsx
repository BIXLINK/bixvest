import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminAdjustVst, setMembershipStatus } from "@/lib/bixvest.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users — BIXVEST" }] }),
  component: UsersPage,
});

function fmt(n: number) { return new Intl.NumberFormat("en-US").format(n); }

function UsersPage() {
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const setStatus = useServerFn(setMembershipStatus);
  const adjust = useServerFn(adminAdjustVst);
  const [adjustUser, setAdjustUser] = useState<any | null>(null);
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,referral_code.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  async function changeStatus(user_id: string, status: "pending" | "active" | "suspended") {
    try {
      await setStatus({ data: { user_id, status } });
      toast.success("Status updated");
      qc.invalidateQueries();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function doAdjust() {
    if (!adjustUser) return;
    try {
      await adjust({ data: { user_id: adjustUser.id, amount: Number(amount), note } });
      toast.success("VST adjusted");
      setAdjustUser(null); setAmount("0"); setNote("");
      qc.invalidateQueries();
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <Input placeholder="Search by name, email, or referral code" value={q} onChange={e => setQ(e.target.value)} className="max-w-sm" />
        </div>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">VST</th>
                <th className="px-4 py-3 text-left font-medium">Level</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={u.membership_status} onValueChange={(v: any) => changeStatus(u.id, v)}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">{fmt(Number(u.vst_balance))} / <span className="text-muted-foreground">{fmt(Number(u.vst_locked))}</span></td>
                  <td className="px-4 py-3">L{u.current_stake_level}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setAdjustUser(u)}>Adjust VST</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!adjustUser} onOpenChange={o => !o && setAdjustUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust VST — {adjustUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount (positive to credit, negative to debit)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustUser(null)}>Cancel</Button>
            <Button onClick={doAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
