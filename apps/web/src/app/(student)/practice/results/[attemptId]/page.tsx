'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getAttempt, formatQuizType, type GradedAnswer } from '@/lib/assessment';

export default function QuizResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();

  const { data: result, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => getAttempt(attemptId, token!),
    enabled: !!token && !!attemptId,
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || isLoading) {
    return <div className="py-12 text-center text-slate-500">Loading results…</div>;
  }

  if (!result) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Results not found.</p>
        <Link href="/practice" className="mt-4 inline-block text-efundo-primary hover:underline">
          ← Back to practice
        </Link>
      </div>
    );
  }

  const graded = Array.isArray(result.answers) ? (result.answers as GradedAnswer[]) : [];
  const certificate = result.certificate;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/practice" className="text-sm text-efundo-primary hover:underline">
        ← Practice
      </Link>

      <div
        className={`mt-4 rounded-2xl border p-8 text-center ${
          result.passed
            ? 'border-green-200 bg-green-50'
            : result.hasPendingEssays
              ? 'border-blue-200 bg-blue-50'
              : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          {formatQuizType(result.quiz.type)}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{result.quiz.title}</h1>
        <p className="mt-1 text-slate-600">{result.quiz.subject.code}</p>
        <p className="mt-6 text-5xl font-bold text-slate-900">
          {result.score != null ? `${result.score}%` : '—'}
        </p>
        <p className="mt-2 text-lg font-medium">
          {result.correctCount} / {result.totalCount} auto-graded correct
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${
            result.passed
              ? 'text-green-700'
              : result.hasPendingEssays
                ? 'text-blue-700'
                : 'text-amber-700'
          }`}
        >
          {result.passed
            ? 'Passed'
            : result.hasPendingEssays
              ? 'Essay responses saved — awaiting lecturer review'
              : `Need ${result.quiz.passingScore}% to pass`}
        </p>
        {certificate && (
          <Link
            href={`/practice/certificates/${certificate.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark"
          >
            View certificate ({certificate.code})
          </Link>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/practice/${result.quiz.id}`}
          className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark"
        >
          Try again
        </Link>
        {certificate && (
          <Link
            href={`/practice/certificates/${certificate.id}`}
            className="rounded-lg border border-efundo-primary px-4 py-2 text-sm font-medium text-efundo-primary hover:bg-efundo-primary/5"
          >
            Download certificate
          </Link>
        )}
        <Link
          href="/learn"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Review lessons
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Review answers</h2>
        <div className="mt-4 space-y-4">
          {graded.map((item, i) => (
            <AnswerReview key={item.questionId} item={item} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AnswerReview({ item, index }: { item: GradedAnswer; index: number }) {
  const pending = item.isCorrect === null || item.pendingReview;

  return (
    <div
      className={`rounded-xl border p-5 ${
        pending
          ? 'border-blue-200 bg-blue-50/50'
          : item.isCorrect
            ? 'border-green-200 bg-green-50/50'
            : 'border-red-200 bg-red-50/50'
      }`}
    >
      <p className="text-sm font-medium text-slate-900">
        Q{index + 1}.{' '}
        <span
          className={
            pending ? 'text-blue-700' : item.isCorrect ? 'text-green-700' : 'text-red-700'
          }
        >
          {pending ? 'Submitted for review' : item.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
        Your answer: <strong>{String(item.answer) || '(no answer)'}</strong>
      </p>
      {!pending && !item.isCorrect && item.correctAnswer != null && (
        <p className="mt-1 text-sm text-slate-600">
          Correct:{' '}
          <strong>
            {formatCorrectAnswer(item.correctAnswer as Record<string, unknown>)}
          </strong>
        </p>
      )}
      {item.rubric && (
        <p className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-slate-600">
          <span className="font-medium">Marking rubric:</span> {item.rubric}
        </p>
      )}
      {item.explanation && (
        <p className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-slate-600">
          {item.explanation}
        </p>
      )}
    </div>
  );
}

function formatCorrectAnswer(ca: Record<string, unknown>) {
  if (ca.type === 'boolean') return ca.value ? 'True' : 'False';
  if (ca.type === 'single') return String(ca.value);
  if (ca.type === 'essay') return ca.sampleAnswer ? String(ca.sampleAnswer) : 'See rubric';
  if (Array.isArray(ca.values)) return (ca.values as string[]).join(' / ');
  return String(ca.value ?? '');
}
