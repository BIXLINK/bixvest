import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAnalytics } from "@/lib/bixvest.functions";
import { AdminLayout } from "@/components/admin-layout";
import { Users, UserCheck, Coins, Lock, Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/overview")({
  head: () => ({ meta: [{ title: "Admin overview — BIXVEST" }] }),
  component: Overview,
});

function fmt(n: number) { return new Intl.NumberFormat("en-US").format(n); }

function Overview() {
  const fn = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fn(),
  });
  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ecosystem overview.</p>
        </div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card label="Total users" value={fmt(data?.totalUsers ?? 0)} icon={Users} />
            <Card label="Active members" value={fmt(data?.activeMembers ?? 0)} icon={UserCheck} />
            <Card label="VST issued" value={fmt(data?.totalIssued ?? 0)} icon={Coins} />
            <Card label="VST staked" value={fmt(data?.totalStaked ?? 0)} icon={Lock} />
            <Card label="Campaigns" value={fmt(data?.campaigns ?? 0)} icon={Megaphone} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Card({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
