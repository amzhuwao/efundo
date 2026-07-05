import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About eFundo',
  description:
    'Learn about eFundo — a learning platform helping Zimbabwean students access exam papers, notes, and practice tests.',
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">About eFundo</h1>
      <p className="mt-2 text-slate-500">Last updated: July 2026</p>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-slate-600">
        <p className="leading-relaxed">
          eFundo was created to solve a common problem faced by university and
          college students in Zimbabwe: finding reliable, well-organized study
          materials. Past exam papers are scattered across WhatsApp groups,
          lecture notes get lost, and revision resources are hard to search.
        </p>
        <p className="leading-relaxed">
          Our mission is to centralize learning resources — past papers, notes,
          textbooks, lessons, and practice tests — in one platform tailored to
          your institution, faculty, course, and subjects.
        </p>

        <h2 className="text-2xl font-semibold text-slate-900">What we offer</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>A digital library of downloadable study resources</li>
          <li>Structured lessons with videos, text, and exercises</li>
          <li>Practice quizzes and timed mock exams</li>
          <li>Progress tracking and performance insights</li>
          <li>Discussion forums for peer learning</li>
          <li>Mobile app with offline access (coming soon)</li>
        </ul>

        <h2 className="text-2xl font-semibold text-slate-900">Who we serve</h2>
        <p className="leading-relaxed">
          eFundo is built primarily for students at Zimbabwean universities and
          colleges. We also work with lecturers and institutions who want to
          share quality materials with their students through a moderated,
          searchable platform.
        </p>

        <h2 className="text-2xl font-semibold text-slate-900">Our values</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Accessibility</strong> — education resources should be easy to
            find and use
          </li>
          <li>
            <strong>Quality</strong> — uploaded content goes through review
            before publication
          </li>
          <li>
            <strong>Integrity</strong> — we respect academic honesty and
            copyright
          </li>
        </ul>

        <p className="leading-relaxed">
          Have questions? Visit our{' '}
          <Link href="/contact" className="text-efundo-primary underline">
            contact page
          </Link>{' '}
          — we&apos;d love to hear from you.
        </p>
      </div>
    </article>
  );
}
