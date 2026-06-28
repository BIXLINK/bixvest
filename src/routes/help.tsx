import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ — BIXVEST" },
      { name: "description", content: "Frequently asked questions and help documentation" },
    ],
  }),
  component: HelpPage,
});

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <span className="font-medium text-left">{question}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-4 bg-background/50">
          <p className="text-muted-foreground text-sm">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const faqs = [
    {
      question: "What is BIXVEST?",
      answer:
        "BIXVEST is a digital participation platform where you can earn VST through community tasks and campaigns, stake into 10 progressive levels, and build a verifiable activity profile.",
    },
    {
      question: "How do I earn VST?",
      answer:
        "You can earn VST by completing verified community campaigns, engaging in limited-time challenges, and participating in brand partnerships through the Rewards Hub.",
    },
    {
      question: "What are the vault tiers?",
      answer:
        "The vault has 10 progressive levels. Each level requires staking increasing amounts of VST (50K to 50M VST) to unlock higher membership benefits and features.",
    },
    {
      question: "How do I stake VST?",
      answer:
        "Navigate to the Vault page, select your current or next tier, and submit your VST stake. Once confirmed, your tokens are locked into that tier.",
    },
    {
      question: "Can I unstake my VST?",
      answer:
        "Unstaking policies depend on your tier and membership status. Check the Vault page for detailed information about lock-up periods.",
    },
    {
      question: "How do I activate my membership?",
      answer:
        "If you have an activation code, go to the Activate Membership page, enter your code, and follow the prompts to unlock full platform access.",
    },
    {
      question: "What is a referral code?",
      answer:
        "Your unique referral code lets you invite others to BIXVEST. When they join using your code, both of you earn VST rewards.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. BIXVEST uses bank-grade Supabase authentication, encrypted data storage, and role-protected admin operations to keep your data secure.",
    },
    {
      question: "What is my activity profile?",
      answer:
        "Your activity profile is a transparent ledger showing all your earned VST, staking history, and participation events—building a verifiable reputation over time.",
    },
    {
      question: "How do I contact support?",
      answer:
        "Email us at bixvest@protonmail.com for any questions, technical issues, or partnership inquiries.",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-widest text-primary">Support</p>
          <h1 className="mt-3 text-3xl font-display font-bold text-foreground">Help & FAQ</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Find answers to common questions about BIXVEST, earning VST, staking, and managing your
            account.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/"
              className="rounded-md bg-[--color-blue-solid] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
            <a
              href="mailto:bixvest@protonmail.com"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Email Support
            </a>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-display font-bold mb-6">Frequently Asked Questions</h2>
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} />
            ))}

            <div className="mt-12 border-t border-border pt-8">
              <h3 className="text-xl font-display font-bold mb-4">Additional Resources</h3>
              <div className="grid gap-4">
                <Link
                  to="/about"
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:shadow-elegant transition-all"
                >
                  <h4 className="font-semibold mb-2">About BIXVEST</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn about our mission and platform
                  </p>
                </Link>
                <Link
                  to="/terms"
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:shadow-elegant transition-all"
                >
                  <h4 className="font-semibold mb-2">Terms of Service</h4>
                  <p className="text-sm text-muted-foreground">
                    Read our legal terms and conditions
                  </p>
                </Link>
                <Link
                  to="/privacy"
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:shadow-elegant transition-all"
                >
                  <h4 className="font-semibold mb-2">Privacy Policy</h4>
                  <p className="text-sm text-muted-foreground">See how we protect your data</p>
                </Link>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-6 sticky top-20">
              <div className="font-medium mb-4">Quick Support</div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Email us</p>
                  <a href="mailto:bixvest@protonmail.com" className="text-primary hover:underline">
                    bixvest@protonmail.com
                  </a>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="font-medium mb-3">Quick Links</p>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/about" className="text-primary hover:underline">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms
                      </Link>
                    </li>
                    <li>
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
