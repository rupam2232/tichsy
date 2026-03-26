import type { Metadata } from "next";
import Link from "next/link";

const effectiveDate = "March 26, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy - Tichsy",
  description:
    "Read how Tichsy collects, uses, secures, and retains data for restaurant operations.",
  alternates: {
    canonical: "/privacy",
  },
};

const sectionClass =
  "rounded-2xl border border-border/60 bg-card/60 p-5 md:p-7 shadow-sm";

export default function PrivacyPage() {
  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 pt-36 pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_8%_10%,hsl(var(--primary)/0.14),transparent_30%),radial-gradient(circle_at_90%_5%,hsl(var(--ring)/0.12),transparent_30%)]"
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-6 md:p-10 shadow-sm backdrop-blur-sm">
            <p className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Legal
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Effective date: {effectiveDate}
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
              This Privacy Policy explains what information Tichsy processes,
              why it is processed, and the controls available to account owners
              using the platform.
            </p>
          </header>

          <div className="space-y-4 text-sm leading-7 text-foreground/95 md:space-y-5 md:text-base">
            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">1. Scope</h2>
              <p className="mt-2 text-muted-foreground">
                This policy applies to Tichsy web application experiences,
                account operations, and related communications for restaurant
                management use cases.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">2. Data We Process</h2>
              <p className="mt-2 text-muted-foreground">Depending on how you use Tichsy, we may process:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  Account and profile data, such as name, email, encrypted
                  password, avatar, timezone, and authentication identifiers.
                </li>
                <li>
                  Device and session data, such as device ID, browser/OS,
                  approximate IP-based location, IP address, user agent, and
                  session activity timestamps.
                </li>
                <li>
                  Security data, such as login, password-change, and related
                  security event records.
                </li>
                <li>
                  Restaurant operations data, such as menus, tables, orders,
                  staff membership, invitations, and coupons.
                </li>
                <li>
                  Billing and subscription data, including plan, billing period,
                  payment status, and payment gateway references required for
                  transaction verification.
                </li>
                <li>
                  Communication data, including in-app notifications and
                  transactional email delivery records.
                </li>
              </ul>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">3. Why We Process Data</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
                <li>To create and secure your account and authenticate access.</li>
                <li>
                  To operate core product features, including menu, table, and
                  order management.
                </li>
                <li>To process subscriptions and payment confirmations.</li>
                <li>
                  To send service messages such as security alerts, account
                  events, and billing notifications.
                </li>
                <li>
                  To detect abuse, reduce fraud risk, and maintain service
                  integrity.
                </li>
              </ul>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                4. Cookies and Device Technologies
              </h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy uses cookies and similar mechanisms for session
                management, device tracking for account security, and service
                continuity. If you block essential cookies, some features may
                not function correctly.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">5. Data Retention</h2>
              <p className="mt-2 text-muted-foreground">
                Retention periods may vary by data type and operational need.
                Current platform defaults include:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
                <li>One-time passwords (OTP): about 10 minutes.</li>
                <li>Inactive device sessions: about 30 days.</li>
                <li>Security events: up to about 365 days.</li>
                <li>Cart records: about 7 days.</li>
                <li>Notifications: about 15 days by default.</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Some business and billing records may be retained longer when
                needed for legal, security, audit, or accounting purposes.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">6. Sharing and Processors</h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy does not sell personal data. We use trusted service
                providers to help run the platform (for example payment,
                authentication, media, and email infrastructure). These providers
                may process limited operational data needed to deliver their
                services on our behalf.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">7. Data Security</h2>
              <p className="mt-2 text-muted-foreground">
                Tichsy uses technical and operational safeguards such as password
                hashing, access controls, verification flows, and security event
                monitoring. No online system can be guaranteed fully secure, but
                we work to reduce risk and respond quickly to suspicious
                activity.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                8. Your Choices and Requests
              </h2>
              <p className="mt-2 text-muted-foreground">
                For account-related privacy questions or requests, reply to
                transactional emails sent by Tichsy and include enough details
                for verification.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className="text-lg font-semibold md:text-xl">
                9. Changes to This Policy
              </h2>
              <p className="mt-2 text-muted-foreground">
                This Privacy Policy may be updated over time. The latest version
                is effective when published on this page.
              </p>
            </section>
          </div>

          <div className="mt-8 border-t border-border/60 pt-6 text-sm text-muted-foreground">
            For service terms, visit the{" "}
            <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>
            .
          </div>
        </div>
      </div>
    </>
  );
}
