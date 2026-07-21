import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Delete your account',
  description:
    'Request deletion of your eFundo account and associated personal data.',
};

export default function AccountDeletionPage() {
  const mailto =
    'mailto:admin@efundo.co.zw?subject=Account%20deletion%20request';

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Delete your account</h1>
      <p className="mt-2 text-slate-500">
        Request removal of your eFundo account and associated data
      </p>

      <div className="mt-8 space-y-8 text-slate-600">
        <section>
          <p className="leading-relaxed">
            You can ask us to delete your eFundo account and the personal data
            linked to it. This includes your profile, sign-in details, learning
            progress, quiz attempts, and other account information stored on our
            servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">How to request deletion</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-6 leading-relaxed">
            <li>
              Email{' '}
              <a href={mailto} className="text-efundo-primary underline">
                admin@efundo.co.zw
              </a>{' '}
              from the email address registered on your account.
            </li>
            <li>
              Use the subject line: <strong>Account deletion request</strong>.
            </li>
            <li>Include your full name and the email you used to sign up.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">What happens next</h2>
          <p className="mt-3 leading-relaxed">
            We verify requests within <strong>30 days</strong>. After deletion,
            you will not be able to sign in. Learning progress and account data
            are removed, except where we must keep limited records for legal,
            security, or short-term backup purposes.
          </p>
          <p className="mt-3 leading-relaxed">
            Files you saved for offline use in the mobile app are stored on your
            device. You can remove them from the app&apos;s Profile screen.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quick request</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Tap below to open your email app with a pre-filled deletion request.
          </p>
          <a
            href={mailto}
            className="mt-4 inline-flex rounded-lg bg-efundo-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Email deletion request
          </a>
        </section>

        <p className="text-sm">
          <Link href="/privacy" className="text-efundo-primary underline">
            Privacy Policy
          </Link>
          {' ? '}
          <Link href="/terms" className="text-efundo-primary underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </article>
  );
}
