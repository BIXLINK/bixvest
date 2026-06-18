import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({
  head: () => ({ meta: [{ title: "Admin · Campaigns — BIXVEST" }] }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [reward, setReward] = useState("100");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => (await supabase.from("campaigns").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function create() {
    const { error } = await supabase.from("campaigns").insert({ title, description: desc, vst_reward: Number(reward) });
    if (error) return toast.error(error.message);
    toast.success("Campaign created");
    setOpen(false); setTitle(""); setDesc(""); setReward("100");
    qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
  }

  async function remove(id: string) {
    await supabase.from("campaigns").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Campaigns</h1>
          <Button onClick={() => setOpen(true)}>New campaign</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="font-display font-semibold">{c.title}</div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-3 text-sm text-primary">+{c.vst_reward} VST</div>
              <div className="mt-1 text-xs text-muted-foreground uppercase">{c.status}</div>
            </div>
          ))}
          {campaigns.length === 0 && <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No campaigns yet.</div>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label>VST reward</Label><Input type="number" value={reward} onChange={e => setReward(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
