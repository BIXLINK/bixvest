import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — BIXVEST" },
      {
        name: "description",
        content:
          "BIXVEST — Earn VST, stake into progressive vault tiers, and build a verifiable participation profile.",
      },
      { property: "og:title", content: "About — BIXVEST" },
      {
        property: "og:description",
        content:
          "BIXVEST helps communities reward participation with VST, progressive staking, and verifiable activity profiles.",
      },
    ],
  }),
  component: AboutPage,
});

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-medium">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-primary">About BIXVEST</p>
          <h1 className="mt-3 text-3xl font-display font-bold text-foreground">
            Build VST value. Stake with confidence.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            BIXVEST is a secure participation platform for communities to earn, stake and record
            digital activity. Earn VST through verified tasks, lock tokens into progressive vault
            tiers, and surface a tamper-resistant participation history that grows with you.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-[--color-blue-solid] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
            <Link to="/" className="rounded-md border border-input px-4 py-2 text-sm font-medium">
              Home
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <Feature title="VST Rewards Hub">
            Complete verified campaigns and tasks to earn VST that accumulates in your account.
          </Feature>
          <Feature title="Progressive Vault">
            Sequential vault tiers let you lock VST to unlock higher membership levels and benefits.
          </Feature>
          <Feature title="Activity Profile">
            A transparent activity ledger showing your earned reputation and stake history.
          </Feature>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="font-medium">How it works</div>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Earn VST by participating in community campaigns.</li>
              <li>Stake VST into vault tiers sequentially to progress levels.</li>
              <li>Locked stakes and activity history are recorded in your profile.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="font-medium">Security & trust</div>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Authenticated access via Supabase.</li>
              <li>Ledger-backed balance updates for atomic stake operations.</li>
              <li>Role-protected admin operations and audit-friendly records.</li>
            </ul>
          </div>
        </section>

        <section className="mt-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="font-medium">Contact</div>
            <div className="mt-3 text-sm text-muted-foreground">
              For partnerships, support, or developer inquiries, email{" "}
              <a href="mailto:bixvest@protonmail.com" className="text-primary hover:underline">
                bixvest@protonmail.com
              </a>
              .
            </div>
          </div>
        </section>

        <footer className="mt-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bixvest Holdings. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
