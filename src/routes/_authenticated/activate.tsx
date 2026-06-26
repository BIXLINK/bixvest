import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useProfile } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { activateMembership } from "@/lib/bixvest.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/activate")({
  head: () => ({ meta: [{ title: "Activate membership — BIXVEST" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isAdmin = (roles ?? []).some(r => r.role === "super_admin" || r.role === "admin");
    if (isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: ActivatePage,
});

function ActivatePage() {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const activate = useServerFn(activateMembership);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoading && profile?.membership_status === "active") {
    navigate({ to: "/dashboard", replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await activate({ data: { code } });
      toast.success("Membership activated.");
      await qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-12 text-white">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur shadow-elegant">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider">
          <Sparkles className="h-3 w-3" /> Pending activation
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Activate your membership</h1>
          <p className="mt-2 text-white/70 text-sm">Enter the VST activation code provided by your administrator to unlock the ecosystem.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Activation code</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="VST-XXXX-XXXX"
                className="pl-9 font-mono tracking-wider bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-gradient-emerald shadow-glow" disabled={loading}>
            {loading ? "Activating..." : "Activate membership"}
          </Button>
        </form>
        <div className="text-xs text-white/50">
          One code per account. Codes are single-use and admin-controlled.
        </div>
      </div>
    </div>
  );
}
