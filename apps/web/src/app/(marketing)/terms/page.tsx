import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'eFundo Terms of Service — rules and guidelines for using our learning platform.',
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-slate-500">Effective date: July 5, 2026</p>

      <div className="mt-8 space-y-8 text-slate-600">
        <section>
          <p className="leading-relaxed">
            Welcome to eFundo. By accessing or using our website and services, you
            agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do
            not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. The Service</h2>
          <p className="mt-3 leading-relaxed">
            eFundo provides an online platform for students to access study
            resources including past exam papers, notes, textbooks, lessons, and
            practice tests. Features may change or expand over time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Accounts</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for keeping your login credentials secure</li>
            <li>You must be at least 16 years old to use the Service</li>
            <li>One person may not maintain more than one personal account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Acceptable use</h2>
          <p className="mt-3 leading-relaxed">You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Upload content that infringes copyright or intellectual property</li>
            <li>Share account credentials or circumvent access controls</li>
            <li>Use automated tools to scrape or mass-download content</li>
            <li>Upload malware, spam, or harmful material</li>
            <li>Harass other users in forums or discussions</li>
            <li>Use the platform for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Content and copyright</h2>
          <p className="mt-3 leading-relaxed">
            Resources on eFundo may be uploaded by lecturers, students, or
            administrators. We strive to ensure content is legitimate but do not
            guarantee accuracy or ownership of all materials. If you believe
            content infringes your rights, contact{' '}
            <a
              href="mailto:content@efundo.co.zw"
              className="text-efundo-primary underline"
            >
              content@efundo.co.zw
            </a>{' '}
            with details for review and removal.
          </p>
          <p className="mt-3 leading-relaxed">
            By uploading content, you grant eFundo a non-exclusive licence to
            host, display, and distribute that content on the platform for
            educational purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            5. Advertising and premium features
          </h2>
          <p className="mt-3 leading-relaxed">
            The free tier of eFundo may display advertisements through Google
            AdSense and other partners. Premium subscription plans may offer
            ad-free access and additional features. Subscription terms and pricing
            will be disclosed at the time of purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Disclaimer</h2>
          <p className="mt-3 leading-relaxed">
            eFundo is provided &quot;as is&quot; without warranties of any kind. We do
            not guarantee exam results, grade improvements, or uninterrupted
            service. Study resources are for educational support and should not
            replace official course materials or lecturer guidance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">
            7. Limitation of liability
          </h2>
          <p className="mt-3 leading-relaxed">
            To the fullest extent permitted by law, eFundo shall not be liable
            for any indirect, incidental, or consequential damages arising from
            your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Termination</h2>
          <p className="mt-3 leading-relaxed">
            We may suspend or terminate your account if you violate these Terms.
            You may delete your account at any time by contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">9. Governing law</h2>
          <p className="mt-3 leading-relaxed">
            These Terms are governed by the laws of Zimbabwe. Disputes shall be
            subject to the exclusive jurisdiction of the courts of Zimbabwe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">10. Contact</h2>
          <p className="mt-3 leading-relaxed">
            Questions about these Terms? Contact{' '}
            <a
              href="mailto:support@efundo.co.zw"
              className="text-efundo-primary underline"
            >
              support@efundo.co.zw
            </a>{' '}
            or visit our{' '}
            <Link href="/contact" className="text-efundo-primary underline">
              contact page
            </Link>
            . See also our{' '}
            <Link href="/privacy" className="text-efundo-primary underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
