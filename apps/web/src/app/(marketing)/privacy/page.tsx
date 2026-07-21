import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'eFundo Privacy Policy — how we collect, use, and protect your data, including cookies and Google AdSense.',
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-slate-500">Effective date: July 5, 2026</p>

      <div className="mt-8 space-y-8 text-slate-600">
        <section>
          <p className="leading-relaxed">
            eFundo (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website and
            platform at efundo.co.zw (the &quot;Service&quot;). This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            1. Information we collect
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Account information:</strong> name, email address,
              password (stored hashed), institution, course, and subject
              preferences when you register.
            </li>
            <li>
              <strong>Usage data:</strong> pages visited, resources downloaded,
              quiz attempts, progress, and interaction with the platform.
            </li>
            <li>
              <strong>Device information:</strong> browser type, IP address,
              operating system, and device identifiers for security and analytics.
            </li>
            <li>
              <strong>Cookies and similar technologies:</strong> see Section 4
              below.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            2. How we use your information
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Provide, maintain, and improve the eFundo platform</li>
            <li>Personalize content based on your institution and subjects</li>
            <li>Process account registration and authentication</li>
            <li>Send service-related notifications (e.g. new resources)</li>
            <li>Analyse usage to improve our services</li>
            <li>Display relevant advertisements (see Section 5)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            3. Sharing your information
          </h2>
          <p className="mt-3 leading-relaxed">
            We do not sell your personal information. We may share data with:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Service providers</strong> who help us operate the platform
              (hosting, analytics, email delivery)
            </li>
            <li>
              <strong>Advertising partners</strong> such as Google AdSense (see
              Section 5)
            </li>
            <li>
              <strong>Legal authorities</strong> when required by law or to
              protect our rights
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            4. Cookies and tracking technologies
          </h2>
          <p className="mt-3 leading-relaxed">
            We use cookies and similar technologies to remember your preferences,
            keep you signed in, analyse traffic, and serve advertisements. Types
            of cookies we use:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Essential cookies:</strong> required for authentication and
              basic site functionality
            </li>
            <li>
              <strong>Analytics cookies:</strong> help us understand how visitors
              use the site
            </li>
            <li>
              <strong>Advertising cookies:</strong> used by Google and partners to
              show relevant ads
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            You can manage cookie preferences through our cookie consent banner
            or your browser settings. Declining non-essential cookies may limit
            some features.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            5. Google AdSense and advertising
          </h2>
          <p className="mt-3 leading-relaxed">
            We use <strong>Google AdSense</strong> to display advertisements on
            our website. Google and its partners may use cookies to serve ads
            based on your prior visits to this site or other websites.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Google&apos;s use of advertising cookies enables it and its partners
              to serve ads based on your visit to our site and/or other sites on
              the Internet.
            </li>
            <li>
              You may opt out of personalized advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                className="text-efundo-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              .
            </li>
            <li>
              Alternatively, visit{' '}
              <a
                href="https://www.aboutads.info/choices/"
                className="text-efundo-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.aboutads.info
              </a>{' '}
              to opt out of third-party vendor use of cookies for personalized
              advertising.
            </li>
          </ul>
          <p className="mt-3 leading-relaxed">
            For more information on how Google uses data, see{' '}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-efundo-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              How Google uses information from sites that use their services
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Data retention</h2>
          <p className="mt-3 leading-relaxed">
            We retain your account data for as long as your account is active. You
            may request deletion of your account by contacting us. Some data may
            be retained as required by law or for legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Your rights</h2>
          <p className="mt-3 leading-relaxed">
            Depending on your location, you may have the right to access, correct,
            delete, or export your personal data. Contact us at{' '}
            <a
              href="mailto:privacy@efundo.co.zw"
              className="text-efundo-primary underline"
            >
              privacy@efundo.co.zw
            </a>{' '}
            to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            7. Account and data deletion
          </h2>
          <p className="mt-3 leading-relaxed">
            You may request deletion of your account and associated personal
            data at any time. See our{' '}
            <Link href="/account-deletion" className="text-efundo-primary underline">
              account deletion page
            </Link>{' '}
            for step-by-step instructions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Children&apos;s privacy</h2>
          <p className="mt-3 leading-relaxed">
            eFundo is intended for university and college students aged 16 and
            older. We do not knowingly collect information from children under
            16. If you believe we have collected such data, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            9. Changes to this policy
          </h2>
          <p className="mt-3 leading-relaxed">
            We may update this Privacy Policy from time to time. We will post the
            updated policy on this page with a revised effective date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">10. Contact us</h2>
          <p className="mt-3 leading-relaxed">
            For privacy-related questions, contact us at{' '}
            <a
              href="mailto:privacy@efundo.co.zw"
              className="text-efundo-primary underline"
            >
              privacy@efundo.co.zw
            </a>{' '}
            or visit our{' '}
            <Link href="/contact" className="text-efundo-primary underline">
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
