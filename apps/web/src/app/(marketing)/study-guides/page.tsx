import type { Metadata } from 'next';
import Link from 'next/link';
import { getStudyGuides } from '@/lib/blog/posts';
import { BlogCard } from '@/components/blog/BlogCard';

export const metadata: Metadata = {
  title: 'Study Guides',
  description:
    'Free study guides for Zimbabwean university students — exam preparation, past papers, revision strategies, and subject-specific tips.',
};

const guideTopics = [
  {
    title: 'Exam preparation',
    desc: 'Timetables, past paper strategies, and institution-specific guides for UZ, MSU, NUST, and CUT.',
  },
  {
    title: 'Subject guides',
    desc: 'Focused advice for Computer Science, Engineering, Accounting, and other core modules.',
  },
  {
    title: 'Study skills',
    desc: 'Active recall, note organization, and techniques backed by learning science.',
  },
];

export default function StudyGuidesPage() {
  const guides = getStudyGuides();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-slate-900">Study Guides</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Free, practical guides written for Zimbabwean university and college
          students. Whether you are preparing for UZ finals, tackling MSU
          programming modules, or organizing notes for the semester ahead, these
          resources are designed to help you study smarter.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {guideTopics.map((topic) => (
          <div
            key={topic.title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-6"
          >
            <h2 className="font-semibold text-slate-900">{topic.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{topic.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-slate-900">All study guides</h2>
        <p className="mt-2 text-slate-600">
          {guides.length} guides available — updated regularly.
        </p>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {guides.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          Looking for past papers and notes?
        </h2>
        <p className="mt-2 text-slate-600">
          Study guides show you how to revise. eFundo gives you the materials —
          organized by institution, course, and subject.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-efundo-primary px-6 py-2.5 font-semibold text-white hover:bg-efundo-primary-dark"
          >
            Browse resources
          </Link>
          <Link
            href="/blog"
            className="rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            View all blog posts
          </Link>
        </div>
      </section>
    </div>
  );
}
