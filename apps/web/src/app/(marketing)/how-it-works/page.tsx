import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How eFundo Works',
  description:
    'Learn how to use eFundo — sign up, choose your institution and subjects, and access study resources.',
};

const steps = [
  {
    step: 1,
    title: 'Create your free account',
    desc: 'Sign up with your email address. It takes less than a minute. Verify your email and set up your profile.',
  },
  {
    step: 2,
    title: 'Select your institution & course',
    desc: 'Choose your university or college, then pick your course and year of study. eFundo tailors resources to your academic path.',
  },
  {
    step: 3,
    title: 'Pick your subjects',
    desc: 'Select the modules you are studying this semester. Your dashboard and library will highlight relevant materials.',
  },
  {
    step: 4,
    title: 'Browse the digital library',
    desc: 'Search and download past exam papers, lecture notes, textbooks, assignments, and revision guides. Filter by year, semester, and resource type.',
  },
  {
    step: 5,
    title: 'Learn with structured lessons',
    desc: 'Follow topic-based lessons with videos, diagrams, and reading material. Complete exercises and track your progress.',
  },
  {
    step: 6,
    title: 'Test yourself',
    desc: 'Take practice quizzes and timed mock exams. Review your answers, see explanations, and identify weak areas.',
  },
];

export default function HowItWorksPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-900">How eFundo works</h1>
      <p className="mt-4 text-lg text-slate-600">
        Get from sign-up to studying in six simple steps.
      </p>

      <ol className="mt-12 space-y-8">
        {steps.map((item) => (
          <li key={item.step} className="flex gap-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-efundo-primary text-lg font-bold text-white">
              {item.step}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-2xl bg-blue-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ready to begin?</h2>
        <p className="mt-2 text-slate-600">
          Create your account and start accessing resources today.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-xl bg-efundo-primary px-8 py-3 font-semibold text-white hover:bg-efundo-primary-dark"
        >
          Sign up free
        </Link>
      </div>
    </article>
  );
}
