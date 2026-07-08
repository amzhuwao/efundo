'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getCatalog } from '@/lib/lms';
import {
  listQuizzes,
  getMyStats,
  getMyAttempts,
  formatQuizType,
  type QuizType,
} from '@/lib/assessment';
import type { EducationLevel } from '@efundo/shared-types';

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();
  const [subjectId, setSubjectId] = useState(searchParams.get('subject') ?? '');

  const { data: catalog = [] } = useQuery({
    queryKey: ['lms-catalog'],
    queryFn: getCatalog,
    enabled: hasHydrated && !!user,
  });

  const subjects = catalog.flatMap((e) =>
    e.programs.flatMap((p) =>
      p.subjects.map((s) => ({
        ...s,
        level: e.level as EducationLevel,
        programName: p.name,
      })),
    ),
  );

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes', subjectId],
    queryFn: () => listQuizzes(subjectId || undefined, token),
    enabled: !!token,
  });

  const { data: stats } = useQuery({
    queryKey: ['assessment-stats'],
    queryFn: () => getMyStats(token!),
    enabled: !!token,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => getMyAttempts(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  useEffect(() => {
    const subject = searchParams.get('subject');
    if (subject) setSubjectId(subject);
  }, [searchParams]);

  if (!hasHydrated || !user) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>;
  }

  const practiceQuizzes = quizzes.filter((q) => q.type === 'PRACTICE');
  const mockExams = quizzes.filter((q) => q.type === 'MOCK_EXAM');

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice &amp; mock exams</h1>
          <p className="mt-1 text-slate-600">
            Test your knowledge with practice quizzes and timed mock exams
          </p>
        </div>
      </div>

      {stats && stats.totalAttempts > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Attempts</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalAttempts}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Average score</p>
            <p className="mt-1 text-2xl font-bold text-efundo-primary">{stats.avgScore}%</p>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Passed</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.passed}</p>
          </div>
        </div>
      )}

      {stats && stats.weakAreas.length > 0 && (
        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">Areas to review</h2>
          <ul className="mt-2 space-y-1">
            {stats.weakAreas.map((area) => (
              <li key={area.subjectCode} className="text-sm text-amber-800">
                {area.subjectCode} — {area.subjectName}: avg {area.avgScore}%
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <label className="block text-sm font-medium text-slate-700">Filter by subject</label>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="mt-2 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </section>

      {isLoading ? (
        <p className="mt-8 text-center text-slate-500">Loading quizzes…</p>
      ) : (
        <div className="mt-8 space-y-10">
          <QuizSection title="Practice quizzes" quizzes={practiceQuizzes} />
          <QuizSection title="Mock exams" quizzes={mockExams} isMock />
        </div>
      )}

      {attempts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900">Recent attempts</h2>
          <ul className="mt-4 divide-y rounded-xl border bg-white">
            {attempts.slice(0, 8).map((a) => (
              <li key={a.id}>
                <Link
                  href={`/practice/results/${a.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{a.quiz.title}</p>
                    <p className="text-xs text-slate-500">
                      {a.quiz.subject.code} · {formatQuizType(a.quiz.type)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      a.passed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {a.score}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QuizSection({
  title,
  quizzes,
  isMock,
}: {
  title: string;
  quizzes: Array<{
    id: string;
    title: string;
    description?: string | null;
    type: QuizType;
    timeLimitMinutes?: number | null;
    questionCount: number;
    passingScore: number;
    subject: { code: string; name: string };
    _count: { questions: number };
  }>;
  isMock?: boolean;
}) {
  if (quizzes.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">No quizzes available yet for this subject.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/practice/${quiz.id}`}
            className={`block rounded-xl border bg-white p-5 shadow-sm transition hover:border-efundo-primary/40 ${
              isMock ? 'border-l-4 border-l-amber-400' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {quiz.subject.code}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900">{quiz.title}</h3>
                {quiz.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{quiz.description}</p>
                )}
              </div>
              <span className="shrink-0 rounded-lg bg-efundo-primary/10 px-2 py-1 text-xs font-medium text-efundo-primary">
                Start →
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>{quiz._count.questions || quiz.questionCount} questions</span>
              {quiz.timeLimitMinutes && <span>{quiz.timeLimitMinutes} min limit</span>}
              <span>Pass: {quiz.passingScore}%</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
