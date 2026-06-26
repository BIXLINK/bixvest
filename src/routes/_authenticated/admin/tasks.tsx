import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { reviewSubmission } from "@/lib/bixvest.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tasks")({
  head: () => ({ meta: [{ title: "Admin · Tasks — BIXVEST" }] }),
  component: TasksPage,
});

function TasksPage() {
  const qc = useQueryClient();
  const review = useServerFn(reviewSubmission);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<string>("engagement");
  const [reward, setReward] = useState("100");

  const { data: tasks = [] } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => (await supabase.from("tasks").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => (await supabase.from("task_submissions")
      .select("*, tasks(title, vst_reward), profiles!task_submissions_user_id_fkey(email, full_name)")
      .order("created_at", { ascending: false }).limit(200)).data ?? [],
  });

  async function create() {
    const { error } = await supabase.from("tasks").insert({ title, description: desc, type: type as any, vst_reward: Number(reward) });
    if (error) return toast.error(error.message);
    toast.success("Task created"); setOpen(false); setTitle(""); setDesc(""); setReward("100");
    qc.invalidateQueries({ queryKey: ["admin-tasks"] });
  }
  async function remove(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-tasks"] });
  }
  async function decide(id: string, decision: "approved" | "rejected") {
    try {
      await review({ data: { submission_id: id, decision } });
      toast.success(decision === "approved" ? "Approved & VST credited" : "Rejected");
      qc.invalidateQueries();
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Tasks</h1>
          <Button onClick={() => setOpen(true)}>New task</Button>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">All tasks</TabsTrigger>
            <TabsTrigger value="review">
              Review submissions{submissions.filter((s: any) => s.status === "pending").length ? ` (${submissions.filter((s: any) => s.status === "pending").length})` : ""}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map(t => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.type}</div>
                      <div className="font-display font-semibold">{t.title}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  <div className="mt-3 text-sm text-primary">+{t.vst_reward} VST</div>
                </div>
              ))}
              {tasks.length === 0 && <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No tasks yet.</div>}
            </div>
          </TabsContent>
          <TabsContent value="review" className="mt-4">
            <div className="rounded-xl border border-border bg-card">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No submissions.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {submissions.map((s: any) => (
                    <li key={s.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <div className="font-medium text-sm">{s.tasks?.title} <span className="text-muted-foreground">— {s.profiles?.email}</span></div>
                        <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()} · {s.status}</div>
                        {s.proof && <div className="mt-1 text-xs bg-muted rounded p-2 break-words">{s.proof}</div>}
                      </div>
                      {s.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => decide(s.id, "rejected")}><X className="h-3 w-3 mr-1" /> Reject</Button>
                          <Button size="sm" onClick={() => decide(s.id, "approved")}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
