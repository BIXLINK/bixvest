import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Users, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — BIXVEST" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: prof } = await supabase.from("profiles").select("membership_status").eq("id", data.user.id).maybeSingle();
    if (prof && prof.membership_status !== "active") throw redirect({ to: "/activate" });
  },
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data: profile } = useProfile();
  const link = profile?.referral_code
    ? (typeof window !== "undefined" ? `${window.location.origin}/auth?mode=signup&ref=${profile.referral_code}` : "")
    : "";

  const { data: network = [] } = useQuery({
    queryKey: ["network", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from("referrals").select("*, referred:profiles!referrals_referred_id_fkey(full_name, email, membership_status, created_at)")
        .eq("referrer_id", profile!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Referral Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">Invite members and grow your network.</p>
        </div>

        <div className="rounded-xl border border-transparent bg-gradient-card p-6 text-white shadow-elegant">
          <div className="text-xs uppercase tracking-wider text-white/60">Your VST Referral ID</div>
          <div className="mt-2 font-display text-3xl font-bold tracking-wider">{profile?.referral_code ?? "—"}</div>
          <div className="mt-4 flex gap-2">
            <Input readOnly value={link} className="bg-white/10 border-white/20 text-white" />
            <Button variant="secondary" onClick={() => copy(link)}><Copy className="h-4 w-4" /></Button>
          </div>
          <div className="mt-3 text-xs text-white/60">Referrals don't auto-activate — new members still need an activation code.</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Total invites" value={network.length} icon={Users} />
          <Stat label="Active members" value={network.filter((n: any) => n.referred?.membership_status === "active").length} icon={Share2} />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4 font-display font-semibold">Your network</div>
          {network.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No referrals yet. Share your link above.</div>
          ) : (
            <ul className="divide-y divide-border">
              {network.map((n: any) => (
                <li key={n.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div>
                    <div className="font-medium">{n.referred?.full_name || n.referred?.email || "Member"}</div>
                    <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs uppercase tracking-wider ${n.referred?.membership_status === "active" ? "text-success" : "text-muted-foreground"}`}>
                    {n.referred?.membership_status ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
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
