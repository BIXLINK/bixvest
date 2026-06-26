import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — BIXVEST" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, user } = useProfile();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated.");
    qc.invalidateQueries();
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Info label="Membership" value={profile?.membership_status?.toUpperCase() ?? "—"} />
            <Info label="Stake Level" value={`L${profile?.current_stake_level ?? 0}`} />
            <Info label="Referral ID" value={profile?.referral_code ?? "—"} mono />
            <Info
              label="Joined"
              value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
            />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-medium ${mono ? "font-mono tracking-wider" : ""}`}>{value}</div>
    </div>
  );
}
