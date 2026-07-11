'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getCertificate } from '@/lib/assessment';

export default function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();

  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => getCertificate(id, token!),
    enabled: !!token && !!id,
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading certificate…</div>;
  }

  if (!cert) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Certificate not found.</p>
        <Link href="/practice/certificates" className="mt-4 inline-block text-efundo-primary hover:underline">
          ← My certificates
        </Link>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-ZW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/practice/certificates" className="text-sm text-efundo-primary hover:underline">
          ← My certificates
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark"
        >
          Print / save PDF
        </button>
      </div>

      <div className="certificate-print rounded-2xl border-4 border-double border-efundo-primary/30 bg-white p-10 shadow-lg">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-efundo-primary">
            eFundo
          </p>
          <h1 className="mt-4 font-serif text-3xl font-bold text-slate-900">
            Certificate of Achievement
          </h1>
          <p className="mt-2 text-slate-600">This certifies that</p>
          <p className="mt-4 text-2xl font-semibold text-slate-900">{cert.user.fullName}</p>
          <p className="mt-6 text-slate-600">has successfully passed the mock examination</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{cert.quiz.title}</p>
          <p className="mt-1 text-slate-600">{cert.quiz.subject.name} ({cert.quiz.subject.code})</p>
          <p className="mt-6 text-4xl font-bold text-efundo-primary">{cert.score}%</p>
          <p className="mt-8 text-sm text-slate-500">Issued on {issuedDate}</p>
          <p className="mt-4 font-mono text-sm text-slate-400">Verification code: {cert.code}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-print,
          .certificate-print * {
            visibility: visible;
          }
          .certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
