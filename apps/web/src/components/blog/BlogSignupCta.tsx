'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { getHomeHref } from '@/lib/roles';

export function BlogSignupCta() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return (
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Put these tips into practice
        </h2>
        <p className="mt-2 text-slate-600">
          Open lessons, past papers, and practice tests in your library.
        </p>
        <Link
          href={getHomeHref(user.role)}
          className="mt-4 inline-block rounded-xl bg-efundo-primary px-6 py-2.5 font-semibold text-white hover:bg-efundo-primary-dark"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 rounded-2xl bg-blue-50 p-8 text-center">
      <h2 className="text-xl font-bold text-slate-900">
        Put these tips into practice
      </h2>
      <p className="mt-2 text-slate-600">
        Access past papers, notes, and practice tests on eFundo.
      </p>
      <Link
        href="/register"
        className="mt-4 inline-block rounded-xl bg-efundo-primary px-6 py-2.5 font-semibold text-white hover:bg-efundo-primary-dark"
      >
        Create free account
      </Link>
    </div>
  );
}
