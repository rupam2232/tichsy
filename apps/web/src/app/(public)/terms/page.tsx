import type { Metadata } from "next";
import Link from "next/link";

const effectiveDate = "March 26, 2026";

export const metadata: Metadata = {
  title: "Terms of Service - Tichsy",
  description:
    "Read the Terms of Service for using Tichsy, including subscriptions, billing, acceptable use, and legal terms.",
  alternates: {
    canonical: "/terms",
  },
};

const sectionClass =
  "rounded-2xl border border-border/60 bg-card/60 p-5 md:p-7 shadow-sm";

export default function TermsPage() {
  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 pt-36 pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_15%_10%,hsl(var(--primary)/0.14),transparent_30%),radial-gradient(circle_at_85%_5%,hsl(var(--ring)/0.12),transparent_28%)]"
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-6 md:p-10 shadow-sm backdrop-blur-sm">
            <p className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Legal
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Effective date: {effectiveDate}
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
              These Terms govern your use of Tichsy as a restaurant software
              platform. By creating an account or using the service, you agree
              to these Terms.
            </p>
          </header>

          <div className="space-y-4 text-sm leading-7 text-foreground/95 md:space-y-5 md:text-base">
            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">1. Scope</h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy is provided primarily to restaurant owners and operators
                to manage menus, tables, orders, staff, and related operations.
                You are responsible for ensuring your use complies with
                applicable local laws and regulations for your business.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                2. Accounts and Security
              </h2>
              <p className="mt-2 text-muted-foreground">
                You must provide accurate account information and keep your
                credentials confidential. You are responsible for activity under
                your account, including activity by team members you invite. You
                must notify Tichsy promptly if you suspect unauthorized access.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">3. Acceptable Use</h2>
              <p className="mt-2 text-muted-foreground">
                You may not use Tichsy to violate laws, infringe intellectual
                property, transmit malicious code, attempt unauthorized access,
                interfere with service operation, or abuse payment or billing
                systems.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                4. Subscriptions, Billing, and Refunds
              </h2>
              <p className="mt-2 text-muted-foreground">
                Paid plans are billed in advance and handled through supported
                payment providers. Subscription features and limits are tied to
                your active plan. If payment fails or a subscription expires,
                Tichsy may limit or downgrade features after applicable grace
                periods.
              </p>
              <p className="mt-2 text-muted-foreground">
                Except where required by law, subscription fees are
                non-refundable.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">5. Plan Limits</h2>
              <p className="mt-2 text-muted-foreground">
                Your plan may limit resources such as number of restaurants,
                tables, menu items, images, and staff accounts. If your account
                exceeds limits because of downgrade or non-renewal, Tichsy may
                archive excess resources to enforce plan limits.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                6. Intellectual Property
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy and its software, branding, and service design are owned
                by Tichsy. You retain rights to your business content (for
                example menu text, branding assets, and operational data) and
                grant Tichsy a limited license to host and process that content
                to operate the service.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                7. Suspension and Termination
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy may suspend or terminate access if you violate these
                Terms, create legal or security risk, or misuse the platform.
                You may stop using the service at any time.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">8. Disclaimers</h2>
              <p className="mt-2 text-muted-foreground">
                The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
                To the maximum extent permitted by law, Tichsy disclaims implied
                warranties, including merchantability, fitness for a particular
                purpose, and non-infringement.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                9. Limitation of Liability
              </h2>
              <p className="mt-2 text-muted-foreground">
                To the maximum extent permitted by law, Tichsy is not liable for
                indirect, incidental, special, consequential, or punitive
                damages, or any loss of profits, revenue, data, goodwill, or
                business interruption arising from your use of the service.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">10. Indemnity</h2>
              <p className="mt-2 text-muted-foreground">
                You agree to indemnify and hold harmless Tichsy from claims,
                liabilities, losses, and expenses arising from your use of the
                service, your business operations, or your violation of these
                Terms.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                11. Governing Law
              </h2>
              <p className="mt-2 text-muted-foreground">
                These Terms are governed by the laws of India, without regard to
                conflict-of-law principles.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                12. Changes to These Terms
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy may update these Terms from time to time. The updated
                version becomes effective when posted on this page, and your
                continued use of the service means you accept the updated Terms.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">13. Contact</h2>
              <p className="mt-2 text-muted-foreground">
                For legal notices, support, or account-related concerns, reply
                to transactional emails sent by Tichsy.
              </p>
            </section>
          </div>

          <div className="mt-8 border-t border-border/60 pt-6 text-sm text-muted-foreground">
            Looking for data practices? Read the{" "}
            <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </>
  );
}
