import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BIXVEST" },
      {
        name: "description",
        content: "BIXVEST Privacy Policy - How we collect, use, and protect your data.",
      },
    ],
  }),
  component: PrivacyPage,
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur dark:bg-[--color-black-solid]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo />
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
          <h1 className="text-3xl font-display font-bold mb-6">Privacy Policy</h1>

          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
            <p>
              Bixvest Holdings ("we", "us", "our", or "Company") operates the BIXVEST website and
              service. This page informs you of our policies regarding the collection, use, and
              disclosure of personal data when you use our Service and the choices you have
              associated with that data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Account Information:</strong> Email, name, password hash
              </li>
              <li>
                <strong>Profile Data:</strong> VST balance, staking history, activity records
              </li>
              <li>
                <strong>Technical Data:</strong> IP address, browser type, pages visited, timestamps
              </li>
              <li>
                <strong>Transaction Data:</strong> VST transfers, stakes, rewards earned
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Use of Data</h2>
            <p>Bixvest Holdings uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>To provide and maintain the Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To detect, prevent and address technical and security issues</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Security of Data</h2>
            <p>
              The security of your data is important to us but remember that no method of
              transmission over the Internet or method of electronic storage is 100% secure. While
              we strive to use commercially acceptable means to protect your Personal Data, we
              cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Protection Rights</h2>
            <p>Depending on your location, you may have the following data protection rights:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>The right to request access to your Personal Data</li>
              <li>The right to request correction of inaccurate data</li>
              <li>The right to request deletion of your data</li>
              <li>The right to restrict processing of your data</li>
              <li>The right to data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Cookies</h2>
            <p>
              We use cookies to enhance your experience. Cookies are small files stored on your
              device that help us remember your preferences. You can instruct your browser to refuse
              all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Third-Party Services</h2>
            <p>
              Our Service may contain links to third-party websites and services that are not
              operated by us. This Privacy Policy does not apply to third-party websites, and we are
              not responsible for their privacy practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Compliance with Laws</h2>
            <p>
              We will disclose your Personal Data where required by law or where we believe in good
              faith that such action is necessary to comply with legal obligations, protect our
              rights, or protect the safety of others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date at
              the top of this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
