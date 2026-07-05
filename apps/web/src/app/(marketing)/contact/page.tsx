import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact eFundo',
  description: 'Get in touch with the eFundo team for support, partnerships, or content inquiries.',
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">Contact us</h1>
      <p className="mt-4 text-lg text-slate-600">
        We&apos;re here to help with account issues, content requests,
        partnerships, and general enquiries.
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">General support</h2>
          <p className="mt-2 text-slate-600">
            For help with your account, downloads, or using the platform:
          </p>
          <p className="mt-3">
            <a
              href="mailto:support@efundo.co.zw"
              className="font-medium text-efundo-primary underline"
            >
              support@efundo.co.zw
            </a>
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Content & partnerships
          </h2>
          <p className="mt-2 text-slate-600">
            Lecturers, institutions, or contributors interested in sharing
            materials:
          </p>
          <p className="mt-3">
            <a
              href="mailto:content@efundo.co.zw"
              className="font-medium text-efundo-primary underline"
            >
              content@efundo.co.zw
            </a>
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Privacy enquiries</h2>
          <p className="mt-2 text-slate-600">
            Questions about your data or our Privacy Policy:
          </p>
          <p className="mt-3">
            <a
              href="mailto:privacy@efundo.co.zw"
              className="font-medium text-efundo-primary underline"
            >
              privacy@efundo.co.zw
            </a>
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Response time</h2>
          <p className="mt-2 text-sm text-slate-600">
            We aim to respond to all enquiries within 2–3 business days. For
            urgent account access issues, include your registered email address
            in your message.
          </p>
        </section>
      </div>
    </article>
  );
}
