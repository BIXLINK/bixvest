import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — BIXVEST" },
      {
        name: "description",
        content: "BIXVEST Terms of Service - Read our legal terms and conditions.",
      },
    ],
  }),
  component: TermsPage,
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur dark:bg-[--color-black-solid]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/bixvest logo.png" alt="BIXVEST" className="h-8 w-8 rounded-lg" />
            <div className="font-display text-lg font-bold tracking-tight text-[--color-black-solid] dark:text-white">
              BIXVEST
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="prose prose-invert max-w-none dark:prose-invert">
          <h1 className="text-3xl font-display font-bold mb-6">Terms of Service</h1>

          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using BIXVEST ("Service"), you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to abide by the above,
              please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information
              or software) on BIXVEST for personal, non-commercial transitory viewing only. This is
              the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile, reverse engineer, or discovering any source code</li>
              <li>
                Transferring the materials to another person or "mirroring" on any other server
              </li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Uploading viruses or malicious code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">3. VST Token Terms</h2>
            <p>
              VST is a utility token issued by Bixvest Holdings for use within the BIXVEST
              ecosystem. VST holdings do not constitute ownership, equity, or any claim on revenue.
              VST may have no value outside the platform and is subject to complete loss.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">4. User Accounts & Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account information
              and password. You agree to accept responsibility for all activities that occur under
              your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Disclaimer of Warranties</h2>
            <p>
              The materials on BIXVEST are provided on an 'as is' basis. Bixvest Holdings makes no
              warranties, expressed or implied, and hereby disclaims and negates all other
              warranties including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of intellectual
              property or other violation of rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Limitations of Liability</h2>
            <p>
              In no event shall Bixvest Holdings or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the materials on BIXVEST.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Accuracy of Materials</h2>
            <p>
              The materials appearing on BIXVEST could include technical, typographical, or
              photographic errors. Bixvest Holdings does not warrant that any of the materials on
              its website are accurate, complete, or current.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Modifications</h2>
            <p>
              Bixvest Holdings may revise these terms of service for its website at any time without
              notice. By using this website, you are agreeing to be bound by the then current
              version of these terms of service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws
              of the jurisdiction where Bixvest Holdings is registered, and you irrevocably submit
              to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:bixvest@protonmail.com" className="text-primary hover:underline">
                bixvest@protonmail.com
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground mt-12">
        <div className="mx-auto max-w-7xl">
          <div>© {new Date().getFullYear()} Bixvest Holdings. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
