import { createFileRoute } from "@tanstack/react-router";
import { requireActiveOrAdmin } from "@/lib/require-active";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { submitTask } from "@/lib/bixvest.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "VST Rewards Hub — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: RewardsPage,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function RewardsPage() {
  const { data: profile } = useProfile();

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: history = [] } = useQuery({
    queryKey: ["rewards-history", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", profile!.id)
        .eq("type", "earn")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const engagement = tasks.filter((t) => t.type === "engagement");
  const community = tasks.filter((t) => t.type === "community");
  const brand = tasks.filter((t) => t.type === "brand");
  const challenges = tasks.filter((t) => t.type === "challenge");

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">VST Rewards Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Participate. Earn VST. Build your activity profile.
          </p>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="history">VST History</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6 mt-6">
            <TaskSection title="Engagement" items={engagement} />
            <TaskSection title="Community" items={community} />
            <TaskSection title="Brand" items={brand} />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            {campaigns.length === 0 ? (
              <EmptyState text="No active campaigns right now." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                    <Badge variant="secondary">Campaign</Badge>
                    <div className="mt-3 font-display text-lg font-semibold">{c.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-4 text-sm font-medium text-primary">
                      +{fmt(Number(c.vst_reward))} VST
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="mt-6">
            {challenges.length === 0 ? (
              <EmptyState text="No challenges available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {challenges.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="rounded-xl border border-border bg-card">
              {history.length === 0 ? (
                <EmptyState text="No VST earned yet." />
              ) : (
                <ul className="divide-y divide-border">
                  {history.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-6 py-3 text-sm">
                      <div>
                        <div className="font-medium">{t.note || "Earned"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-success">+{fmt(Number(t.amount))} VST</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function TaskSection({ title, items }: { title: string; items: any[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const submit = useServerFn(submitTask);

  async function send() {
    setLoading(true);
    try {
      await submit({ data: { task_id: task.id, proof } });
      toast.success("Submitted. Awaiting review.");
      setOpen(false);
      setProof("");
      qc.invalidateQueries();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col rounded-xl border border-border bg-card p-5">
        <Badge variant="outline" className="w-fit capitalize">
          {task.type}
        </Badge>
        <div className="mt-3 font-display text-base font-semibold">{task.title}</div>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{task.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm font-medium text-primary">
            +{fmt(Number(task.vst_reward))} VST
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            Submit
          </Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          <div className="space-y-2">
            <label className="text-xs font-medium">Proof (link, screenshot URL, notes)</label>
            <Textarea value={proof} onChange={(e) => setProof(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send} disabled={loading}>
              {loading ? "Submitting..." : "Submit for review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
