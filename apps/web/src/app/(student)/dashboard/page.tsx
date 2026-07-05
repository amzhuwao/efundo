'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Welcome back, {user.fullName.split(' ')[0]}!
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="rounded-2xl border bg-white p-6 shadow-sm opacity-60">
          <h3 className="font-semibold text-slate-900">Practice Tests</h3>
          <p className="mt-1 text-sm text-slate-600">Coming in Phase 4</p>
        </div>
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
