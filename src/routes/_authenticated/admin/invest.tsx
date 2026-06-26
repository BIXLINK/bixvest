import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { upsertInvestProduct } from "@/lib/bixvest.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/invest")({
  head: () => ({ meta: [{ title: "Invest Admin — BIXVEST" }] }),
  component: InvestAdmin,
});

function InvestAdmin() {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertInvestProduct);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    min_amount: 100,
    apr: 5,
    status: "draft",
  });

  const { data: products = [] } = useQuery({
    queryKey: ["invest-products-all"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("invest_products")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function save() {
    try {
      await upsert({
        data: { ...form, min_amount: Number(form.min_amount), apr: Number(form.apr) },
      });
      toast.success("Saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["invest-products-all"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Investment Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage products shown in the Invest module.
            </p>
          </div>
          <Button
            onClick={() => {
              setForm({ name: "", description: "", min_amount: 100, apr: 5, status: "draft" });
              setOpen(true);
            }}
          >
            New Product
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2">Min</th>
                <th className="px-3 py-2">APR</th>
                <th className="px-3 py-2">Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-center">{Number(p.min_amount).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">{Number(p.apr).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-center">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setForm(p);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Product" : "New Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs">Min Amount</label>
                  <Input
                    type="number"
                    value={form.min_amount}
                    onChange={(e) => setForm({ ...form, min_amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs">APR %</label>
                  <Input
                    type="number"
                    value={form.apr}
                    onChange={(e) => setForm({ ...form, apr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
