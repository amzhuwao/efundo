'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { listMyCertificates } from '@/lib/assessment';

export default function CertificatesPage() {
  const router = useRouter();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => listMyCertificates(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/practice" className="text-sm text-efundo-primary hover:underline">
        ← Practice
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">My certificates</h1>
      <p className="mt-1 text-slate-600">
        Earned by passing timed mock exams. Share your certificate code to verify results.
      </p>

      {isLoading ? (
        <p className="mt-8 text-center text-slate-500">Loading…</p>
      ) : certificates.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">No certificates yet.</p>
          <Link
            href="/practice"
            className="mt-4 inline-block text-sm font-medium text-efundo-primary hover:underline"
          >
            Take a mock exam →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {certificates.map((cert) => (
            <li key={cert.id}>
              <Link
                href={`/practice/certificates/${cert.id}`}
                className="block rounded-xl border bg-white p-5 shadow-sm transition hover:border-efundo-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{cert.quiz.title}</p>
                    <p className="text-sm text-slate-500">
                      {cert.quiz.subject.code} · {cert.score}%
                    </p>
                  </div>
                  <span className="rounded-lg bg-efundo-primary/10 px-3 py-1 font-mono text-sm font-semibold text-efundo-primary">
                    {cert.code}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Issued {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
