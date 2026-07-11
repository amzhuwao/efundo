'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  startQuiz,
  submitAttempt,
  formatQuizType,
  type QuizQuestion,
  type QuizAttemptStart,
} from '@/lib/assessment';

export default function TakeQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken());
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);

  const [session, setSession] = useState<QuizAttemptStart | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const started = useRef(false);

  const startMut = useMutation({
    mutationFn: () => startQuiz(quizId, token!),
    onSuccess: (data) => {
      setSession(data);
      if (data.expiresAt) {
        const ms = new Date(data.expiresAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  const submitMut = useMutation({
    mutationFn: () =>
      submitAttempt(
        session!.attemptId,
        Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        token!,
      ),
    onSuccess: (result) => router.push(`/practice/results/${result.id}`),
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = useCallback(() => {
    if (!session || submitMut.isPending) return;
    submitMut.mutate();
  }, [session, submitMut, answers]);

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (token && !session && !started.current) {
      started.current = true;
      startMut.mutate();
    }
  }, [token, session]);

  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, handleSubmit]);

  if (!hasHydrated || !user) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        {error ? (
          <>
            <p className="text-red-600">{error}</p>
            <Link href="/practice" className="mt-4 text-efundo-primary hover:underline">
              ← Back to practice
            </Link>
          </>
        ) : (
          <p className="text-slate-500">Preparing your quiz…</p>
        )}
      </div>
    );
  }

  const questions = session.questions;
  const current = questions[currentIndex];
  const allowBacktrack = session.quiz.allowBacktrack;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/practice" className="text-sm text-efundo-primary hover:underline">
            ← Practice
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-900">{session.quiz.title}</h1>
          <p className="text-sm text-slate-500">{formatQuizType(session.quiz.type)}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {timeLeft != null && (
            <span
              className={`rounded-lg px-3 py-1.5 font-mono font-semibold ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          )}
          <span className="text-slate-500">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-efundo-primary transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <QuestionCard
        question={current}
        index={currentIndex}
        total={questions.length}
        value={answers[current.id]}
        onChange={(val) => setAnswers((prev) => ({ ...prev, [current.id]: val }))}
      />

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          disabled={currentIndex === 0 || !allowBacktrack}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-lg bg-efundo-primary px-6 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitMut.isPending}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitMut.isPending ? 'Submitting…' : 'Submit quiz'}
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => (allowBacktrack || i >= currentIndex) && setCurrentIndex(i)}
            className={`h-8 w-8 rounded-lg text-xs font-medium ${
              i === currentIndex
                ? 'bg-efundo-primary text-white'
                : answers[q.id] != null
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  total,
  value,
  onChange,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  value?: string | boolean;
  onChange: (val: string | boolean) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Question {index + 1} of {total}
      </p>
      <h2 className="mt-3 text-lg font-medium text-slate-900">{question.stem}</h2>

      <div className="mt-6 space-y-3">
        {question.type === 'TRUE_FALSE' && (
          <>
            {[
              { val: true, label: 'True' },
              { val: false, label: 'False' },
            ].map((opt) => (
              <label
                key={String(opt.val)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                  value === opt.val
                    ? 'border-efundo-primary bg-efundo-primary/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={value === opt.val}
                  onChange={() => onChange(opt.val)}
                  className="text-efundo-primary"
                />
                <span className="text-sm text-slate-800">{opt.label}</span>
              </label>
            ))}
          </>
        )}

        {question.type === 'MULTIPLE_CHOICE' &&
          question.options?.map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                value === opt.id
                  ? 'border-efundo-primary bg-efundo-primary/5'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt.id}
                onChange={() => onChange(opt.id)}
                className="text-efundo-primary"
              />
              <span className="text-sm text-slate-800">{opt.text}</span>
            </label>
          ))}

        {(question.type === 'SHORT_ANSWER' || question.type === 'FILL_BLANK') && (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer…"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
          />
        )}

        {question.type === 'ESSAY' && (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your essay response…"
            rows={8}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
          />
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
