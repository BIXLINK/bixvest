import { createFileRoute } from "@tanstack/react-router";
import { Bell, Mail, Lock, LogOut, Trash2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — BIXVEST" }] }),
  component: SettingsPage,
});

export default function SettingsPage() {
  const { data: profile, user } = useProfile();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"profile" | "security" | "notifications" | "danger">("profile");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  async function saveName() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated.");
    qc.invalidateQueries();
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              {[
                { id: "profile", label: "Profile", icon: null },
                { id: "security", label: "Security", icon: Lock },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "danger", label: "Danger Zone", icon: null, color: "text-destructive" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as typeof tab)}
                  className={`w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  } ${item.color || ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Tab */}
            {tab === "profile" && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input value={user?.email ?? ""} disabled className="mt-1.5 opacity-50" />
                    </div>
                    <Button onClick={saveName} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4">Account Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard label="VST Balance" value={`${profile?.vst_balance || 0} VST`} />
                    <InfoCard label="BIX Score" value={`${profile?.bix_score || 0}`} />
                    <InfoCard label="Stake Level" value={`L${profile?.current_stake_level || 0}`} />
                    <InfoCard
                      label="Membership"
                      value={profile?.membership_status?.toUpperCase() ?? "—"}
                    />
                    <InfoCard label="Referral ID" value={profile?.referral_code ?? "—"} mono />
                    <InfoCard
                      label="Joined"
                      value={
                        profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString()
                          : "—"
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {tab === "security" && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" /> Password
                  </h2>
                  <Button>Change Password</Button>
                </div>

                <div className="border-t border-border pt-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" /> Two-Factor Authentication (2FA)
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div className="border-t border-border pt-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Active Sessions
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage devices and sessions connected to your account
                  </p>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {tab === "notifications" && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Bell className="h-5 w-5" /> Notification Preferences
                </h2>

                {[
                  { label: "Reward earned", desc: "Get notified when you earn VST rewards" },
                  {
                    label: "Stake completed",
                    desc: "Notifications when staking transactions complete",
                  },
                  {
                    label: "Activity alerts",
                    desc: "Security alerts and suspicious activity warnings",
                  },
                  { label: "Marketing emails", desc: "News and updates about new features" },
                ].map((notif) => (
                  <div
                    key={notif.label}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{notif.label}</p>
                      <p className="text-xs text-muted-foreground">{notif.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Danger Zone Tab */}
            {tab === "danger" && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-destructive">Delete Account</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>

                <div className="border-t border-destructive/20 pt-6">
                  <h2 className="text-lg font-semibold mb-2">Sign Out</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign out of your BIXVEST account
                  </p>
                  <Button variant="outline" onClick={signOut} disabled={loading}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {loading ? "Signing out..." : "Sign Out"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-medium text-sm ${mono ? "font-mono tracking-wider" : ""}`}>
        {value}
      </div>
    </div>
  );
}
