'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { isAdminRole } from '@/lib/roles';
import { getMyStats } from '@/lib/assessment';

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const token = accessToken();

  const { data: stats } = useQuery({
    queryKey: ['assessment-stats'],
    queryFn: () => getMyStats(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (user && isAdminRole(user.role)) {
      router.replace('/admin');
    }
  }, [user, router]);

  if (!user || isAdminRole(user.role)) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Welcome back, {user.fullName.split(' ')[0]}!
      </p>

      {stats && stats.totalAttempts > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Quiz attempts</p>
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
          <Link
            href="/practice/certificates"
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-efundo-primary/40"
          >
            <p className="text-sm text-slate-500">Certificates</p>
            <p className="mt-1 text-2xl font-bold text-efundo-primary">{stats.certificates ?? 0}</p>
          </Link>
        </div>
      )}

      {stats && stats.weakAreas.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Focus areas</p>
          <ul className="mt-2 space-y-1">
            {stats.weakAreas.slice(0, 3).map((area) => (
              <li key={area.subjectCode} className="text-sm text-amber-800">
                {area.subjectCode} — avg {area.avgScore}% ·{' '}
                <Link href="/practice" className="underline">
                  practice more
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/library"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:border-efundo-primary/40"
        >
          <h3 className="font-semibold text-slate-900">Digital Library</h3>
          <p className="mt-1 text-sm text-slate-600">
            Browse past papers, notes, and textbooks
          </p>
        </Link>
        <Link
          href="/learn"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:border-efundo-primary/40"
        >
          <h3 className="font-semibold text-slate-900">Lessons</h3>
          <p className="mt-1 text-sm text-slate-600">
            Structured modules, topics, and lesson content
          </p>
        </Link>
        <Link
          href="/forum"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:border-efundo-primary/40"
        >
          <h3 className="font-semibold text-slate-900">Study Forum</h3>
          <p className="mt-1 text-sm text-slate-600">
            Ask questions and discuss with classmates
          </p>
        </Link>
        <Link
          href="/assistant"
          className="rounded-2xl border border-efundo-primary/30 bg-efundo-primary/5 p-6 shadow-sm transition hover:border-efundo-primary/50"
        >
          <h3 className="font-semibold text-slate-900">AI study tutor</h3>
          <p className="mt-1 text-sm text-slate-600">
            Ask questions and upload assignments for interactive help
          </p>
        </Link>
        <Link
          href="/practice"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:border-efundo-primary/40"
        >
          <h3 className="font-semibold text-slate-900">Practice Tests</h3>
          <p className="mt-1 text-sm text-slate-600">
            Quizzes and timed mock exams with instant feedback
          </p>
        </Link>
      </div>

      {!user.programId && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Complete your profile setup.{' '}
            <Link href="/onboarding" className="font-medium underline">
              Continue onboarding
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
