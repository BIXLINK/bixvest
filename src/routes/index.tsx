import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Vault, Trophy, Shield, ArrowRight, Layers, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BIXVEST — Earn VST, Stake & Grow Your Digital Profile" },
      {
        name: "description",
        content:
          "Join BIXVEST: complete community tasks to earn VST, stake across 10 progressive levels, and build a verifiable digital activity profile from Bixvest Holdings.",
      },
      { property: "og:title", content: "BIXVEST — Earn VST, Stake & Grow Your Digital Profile" },
      {
        property: "og:description",
        content:
          "Complete tasks, earn VST, stake into 10 levels, and grow your digital activity profile.",
      },
      { property: "og:url", content: "https://bixvest.lovable.app/" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7b14809f-7dcd-43b7-8e42-a1b1f3348203/id-preview-ce1e802f--2098b46c-e5af-4655-8737-a9270e32e0cf.lovable.app-1781800520585.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7b14809f-7dcd-43b7-8e42-a1b1f3348203/id-preview-ce1e802f--2098b46c-e5af-4655-8737-a9270e32e0cf.lovable.app-1781800520585.png",
      },
    ],
    links: [{ rel: "canonical", href: "https://bixvest.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-emerald shadow-glow" />
            <div className="font-display text-lg font-bold tracking-tight">BIXVEST</div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/about"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link to="/auth" className="hidden sm:inline-flex">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-hero text-white">
          <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
                <Sparkles className="h-3 w-3" /> Powered by Bixvest Holdings
              </div>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-balance sm:text-5xl lg:text-6xl">
                The VST-powered digital growth ecosystem.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
                Participate in community campaigns, earn VST points, stake into 10 progressive
                levels, and build a digital activity profile that grows with you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-emerald shadow-glow">
                    Create your account <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    Activate membership
                  </Button>
                </Link>
              </div>
              <div className="mt-12 grid max-w-2xl grid-cols-3 gap-6 text-left">
                {[
                  { k: "10", v: "Staking levels" },
                  { k: "50M", v: "Max VST tier" },
                  { k: "∞", v: "Earning potential" },
                ].map((s) => (
                  <div key={s.v}>
                    <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                      {s.k}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-white/60">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary">Core modules</div>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              A complete participation stack.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Five core modules built to grow with you — from your first VST earned to a fully
              staked digital profile.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                t: "VST Rewards Hub",
                d: "Engagement tasks, brand campaigns, limited-time challenges.",
              },
              {
                icon: Vault,
                t: "VST Vault",
                d: "Stake into 10 progressive levels — 50K to 50M VST.",
              },
              {
                icon: Trophy,
                t: "Wallet & History",
                d: "Track every VST earned, spent, and locked.",
              },
              {
                icon: Users,
                t: "Referral Network",
                d: "Grow your network with a unique VST referral ID.",
              },
              {
                icon: Layers,
                t: "Activity Profile",
                d: "Your full participation history, in one place.",
              },
              {
                icon: Shield,
                t: "Secure by design",
                d: "Bank-grade authentication, role-protected admin.",
              },
            ].map((m) => (
              <div
                key={m.t}
                className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{m.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-hero p-10 text-white shadow-elegant lg:p-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Ready to start earning VST?
              </h2>
              <p className="mt-3 text-white/70">
                Create your account in seconds. Activate with your VST code to unlock the full
                ecosystem.
              </p>
              <Link to="/auth" className="mt-6 inline-flex">
                <Button size="lg" className="bg-gradient-gold text-gold-foreground">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 flex items-center justify-center gap-6">
            <Link to="/about" className="hover:underline">
              About
            </Link>
            <a href="mailto:hello@bixvest.example" className="hover:underline">
              Contact
            </a>
          </div>
          <div>© {new Date().getFullYear()} Bixvest Holdings. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
