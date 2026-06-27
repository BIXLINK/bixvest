import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional(),
  ref: z.string().optional(),
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or Create an Account — BIXVEST" },
      { name: "description", content: "Sign in to BIXVEST or create your account to start earning VST, activating membership codes, and joining the digital participation ecosystem." },
      { property: "og:title", content: "Sign in or Create an Account — BIXVEST" },
      { property: "og:description", content: "Access your BIXVEST account, activate membership, and start earning VST." },
      { property: "og:url", content: "https://bixvest.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://bixvest.lovable.app/auth" }],
  }),
  component: AuthPage,
});


function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<string>(search.mode ?? "signin");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: search.redirect ?? "/dashboard", replace: true });
    });
  }, [navigate, search.redirect]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-hero text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-emerald shadow-glow" />
          <div className="font-display text-lg font-bold">BIXVEST</div>
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
            <Sparkles className="h-3 w-3" /> Bixvest Holdings
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-balance">
            Join the VST-powered ecosystem.
          </h1>
          <p className="mt-3 max-w-md text-white/70">Earn through participation. Stake into progressive levels. Grow your digital activity profile.</p>
        </div>
        <div className="text-xs text-white/50">© {new Date().getFullYear()} Bixvest Holdings</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-emerald" />
              <div className="font-display text-lg font-bold">BIXVEST</div>
            </Link>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm onForgot={() => setTab("forgot")} /></TabsContent>
            <TabsContent value="signup"><SignUpForm referralFromUrl={search.ref} /></TabsContent>
            <TabsContent value="forgot"><ForgotForm onBack={() => setTab("signin")} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back.");
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <h2 className="font-display text-2xl font-bold">Welcome back</h2>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Password</Label>
          <button type="button" onClick={onForgot} className="text-xs text-primary hover:underline">Forgot?</button>
        </div>
        <Input type="password" required value={pw} onChange={e => setPw(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm({ referralFromUrl }: { referralFromUrl?: string }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [ref, setRef] = useState(referralFromUrl ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, referral_code: ref || null },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
    navigate({ to: "/activate" });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <h2 className="font-display text-2xl font-bold">Create your account</h2>
      <p className="text-sm text-muted-foreground">After signup your account is <strong>Pending Activation</strong>. Use a VST code to unlock the ecosystem.</p>
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input required value={fullName} onChange={e => setFullName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" required minLength={8} value={pw} onChange={e => setPw(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Referral code <span className="text-muted-foreground">(optional)</span></Label>
        <Input value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="ABCD1234" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Reset email sent if account exists.");
    onBack();
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <h2 className="font-display text-2xl font-bold">Recover account</h2>
      <p className="text-sm text-muted-foreground">Enter your email — we'll send a reset link.</p>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
      <button type="button" onClick={onBack} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground">Back to sign in</button>
    </form>
  );
}
