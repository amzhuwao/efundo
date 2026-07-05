'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  listAssistantSessions,
  createAssistantSession,
} from '@/lib/ai-assistant';

export default function AssistantHomePage() {
  const token = useAuthStore((s) => s.accessToken());
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoStarted = useRef(false);

  const lessonId = searchParams.get('lessonId');
  const subjectId = searchParams.get('subjectId');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: () => listAssistantSessions(token!),
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createAssistantSession(
        {
          lessonId: lessonId ?? undefined,
          subjectId: subjectId ?? undefined,
        },
        token!,
      ),
    onSuccess: (session) => router.replace(`/assistant/${session.id}`),
  });

  useEffect(() => {
    if (!token || autoStarted.current) return;
    if (!lessonId && !subjectId) return;
    autoStarted.current = true;
    createAssistantSession(
      { lessonId: lessonId ?? undefined, subjectId: subjectId ?? undefined },
      token,
    ).then((session) => router.replace(`/assistant/${session.id}`));
  }, [token, lessonId, subjectId, router]);

  function startNewChat() {
    createMut.mutate();
  }

  if (lessonId || subjectId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        Starting your tutoring session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">AI study assistant</h1>
        <p className="mt-2 text-slate-600">
          Get interactive help with lessons and assignments. Upload your work and ask
          questions — the AI guides you without doing your homework for you.
        </p>
      </div>

      <button
        type="button"
        onClick={startNewChat}
        disabled={createMut.isPending}
        className="w-full rounded-2xl bg-efundo-primary px-6 py-4 text-left font-semibold text-white shadow-sm hover:bg-efundo-primary-dark disabled:opacity-50"
      >
        + New conversation
        <span className="mt-1 block text-sm font-normal text-white/80">
          Ask anything or upload an assignment
        </span>
      </button>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent conversations
        </h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No conversations yet.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-white">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/assistant/${s.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.lesson?.title ?? s.subject?.name ?? 'General'}
                    {' · '}
                    {s._count.messages} message{s._count.messages === 1 ? '' : 's'}
                    {s._count.files > 0 &&
                      ` · ${s._count.files} file${s._count.files === 1 ? '' : 's'}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
