import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'eFundo — Past Papers, Notes & Practice Tests for Students',
  description:
    'eFundo helps Zimbabwean university and college students access past exam papers, lecture notes, textbooks, lessons, and practice tests — organized by institution and course.',
  openGraph: {
    title: 'eFundo — Learn Smarter',
    description:
      'Past papers, notes, lessons, and practice tests for university students in Zimbabwe.',
    type: 'website',
  },
};

const institutions = [
  'University of Zimbabwe',
  'Midlands State University',
  'NUST',
  'Chinhoyi University of Technology',
  'Great Zimbabwe University',
  'Mutare Teachers College',
];

const faqs = [
  {
    q: 'What is eFundo?',
    a: 'eFundo is a learning platform built for Zimbabwean students. It brings together past exam papers, lecture notes, textbooks, structured lessons, and practice tests — all organized by your institution, course, and subject.',
  },
  {
    q: 'Is eFundo free to use?',
    a: 'Yes. Students can create a free account to browse resources, track progress, and access core study materials. Premium features such as unlimited downloads and mock exams will be available through optional subscription plans.',
  },
  {
    q: 'Which institutions are supported?',
    a: 'We support major Zimbabwean universities and colleges including UZ, MSU, NUST, CUT, GZU, and teachers colleges. More institutions are added regularly based on student demand and content availability.',
  },
  {
    q: 'How do I upload study materials?',
    a: 'Lecturers and verified contributors can upload notes, past papers, and other resources through our moderation workflow. All uploads are reviewed before being published to ensure quality and accuracy.',
  },
  {
    q: 'Does eFundo use advertising?',
    a: 'We may display advertisements through Google AdSense to help keep the platform accessible. Our Privacy Policy explains how cookies and advertising partners work on this site.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-blue-50 to-slate-50 px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-efundo-primary">
            Built for Zimbabwean students
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Your study resources,{' '}
            <span className="text-efundo-primary">all in one place</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Access past exam papers, lecture notes, textbooks, interactive lessons,
            and practice tests — tailored to your institution, course, and year of
            study.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-efundo-primary px-8 py-3 font-semibold text-white shadow-lg hover:bg-efundo-primary-dark"
            >
              Get started free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-slate-300 bg-white px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Everything you need to study effectively
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            eFundo combines a digital library, learning management tools, and
            assessment features so you can prepare for exams with confidence.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Digital Library',
                desc: 'Download past papers, lecture notes, textbooks, assignments, and revision guides. Resources are tagged by institution, subject, year, and semester for easy discovery.',
              },
              {
                title: 'Lessons & Practice',
                desc: 'Follow structured lessons with videos, diagrams, and exercises. Test yourself with multiple-choice quizzes, timed mock exams, and instant feedback.',
              },
              {
                title: 'Progress Tracking',
                desc: 'Monitor completed lessons, quiz scores, weak areas, and study hours from your personal dashboard. Get recommendations based on your performance.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Supporting students across Zimbabwe
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
            We work with content from and for students at leading institutions:
          </p>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-3">
            {institutions.map((name) => (
              <li
                key={name}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Study guides & tips
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">
                Free articles on exam preparation, revision strategies, and
                subject-specific advice for Zimbabwean students.
              </p>
            </div>
            <Link
              href="/blog"
              className="shrink-0 font-medium text-efundo-primary hover:underline"
            >
              View all articles →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'How to Use Past Papers Effectively',
                href: '/blog/how-to-use-past-papers-effectively',
                category: 'Study Guide',
              },
              {
                title: 'UZ Exam Preparation Guide',
                href: '/blog/uz-exam-preparation-guide',
                category: 'Study Guide',
              },
              {
                title: 'Building a Revision Timetable',
                href: '/blog/building-a-revision-timetable',
                category: 'Exam Tips',
              },
            ].map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="rounded-xl border border-slate-200 p-6 transition hover:border-efundo-primary/30 hover:shadow-sm"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-efundo-primary">
                  {article.category}
                </span>
                <h3 className="mt-2 font-semibold text-slate-900">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 p-6"
              >
                <dt className="font-semibold text-slate-900">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t bg-efundo-primary py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to study smarter?</h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Join eFundo today and get access to resources built for your course
            and institution.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-efundo-primary hover:bg-blue-50"
          >
            Create your free account
          </Link>
        </div>
      </section>
    </>
  );
}
