import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, AlertCircle, Info, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { requireActiveOrAdmin } from "@/lib/require-active";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: NotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function iconFor(title: string) {
  const t = title.toLowerCase();
  if (t.includes("reward") || t.includes("earn") || t.includes("+"))
    return <Sparkles className="h-4 w-4 text-success" />;
  if (t.includes("warn") || t.includes("fail") || t.includes("declin"))
    return <AlertCircle className="h-4 w-4 text-warning" />;
  if (t.includes("confirm") || t.includes("complete") || t.includes("approved"))
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  return <Info className="h-4 w-4 text-primary" />;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function bucket(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return "This week";
  if (diffDays < 30) return "This month";
  return "Earlier";
}

function NotificationsPage() {
  const { data: profile } = useProfile();
  const userId = profile?.id;
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const unread = items.filter((n) => !n.read_at);

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId!)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const g = new Map<string, Notification[]>();
    for (const n of items) {
      const k = bucket(n.created_at);
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(n);
    }
    return Array.from(g.entries());
  }, [items]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Inbox</div>
            <h1 className="font-display text-3xl font-bold">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unread.length > 0
                ? `${unread.length} unread ${unread.length === 1 ? "message" : "messages"}`
                : "You're all caught up."}
            </p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
              <Check className="mr-1.5 h-3.5 w-3.5" /> Mark all as read
            </Button>
          )}
        </header>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">No notifications yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Activity, rewards and account updates will appear here as they happen.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([label, group]) => (
              <section key={label}>
                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </div>
                <ul className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
                  {group.map((n) => {
                    const unread = !n.read_at;
                    return (
                      <li
                        key={n.id}
                        className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                          unread ? "bg-primary/[0.03]" : ""
                        } hover:bg-accent/40`}
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          {iconFor(n.title)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-medium">{n.title}</div>
                            {unread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          {n.body && (
                            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <div className="mt-1 text-[11px] text-muted-foreground/80">
                            {formatRelative(n.created_at)}
                          </div>
                        </div>
                        {unread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => markOne.mutate(n.id)}
                          >
                            Mark read
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
