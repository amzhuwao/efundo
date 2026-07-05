'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  getLesson,
  getModules,
  updateLessonProgress,
  hasVideo,
} from '@/lib/lms';
import {
  CourseOutline,
  LessonVideoPlayer,
  ContentBlock,
} from '@/components/learn/LessonPlayer';

type Tab = 'overview' | 'readings';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => getLesson(id, token),
    enabled: !!id,
  });

  const subjectId = lesson?.topic.module.subject.id;

  const { data: modules = [] } = useQuery({
    queryKey: ['lms-modules', subjectId],
    queryFn: () => getModules(subjectId!, token),
    enabled: !!subjectId,
  });

  const progressMutation = useMutation({
    mutationFn: (data: {
      percentComplete: number;
      lastPosition?: number;
      completed?: boolean;
    }) => updateLessonProgress(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      queryClient.invalidateQueries({ queryKey: ['lms-modules', subjectId] });
      queryClient.invalidateQueries({ queryKey: ['lms-progress'] });
    },
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (lesson && hasVideo(lesson)) setTab('overview');
    else if (lesson) setTab('readings');
  }, [lesson?.id]);

  function saveVideoProgress(seconds: number, percent: number) {
    if (!token) return;
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      progressMutation.mutate({
        percentComplete: Math.max(percent, lesson?.progress?.percentComplete ?? 0),
        lastPosition: Math.floor(seconds),
        completed: percent >= 95,
      });
    }, 3000);
  }

  if (!hasHydrated || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        Loading lesson...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-slate-600">Lesson not found.</p>
        <Link href="/learn" className="mt-4 text-efundo-primary hover:underline">
          ← Back to lessons
        </Link>
      </div>
    );
  }

  const subject = lesson.topic.module.subject;
  const isVideoLesson = hasVideo(lesson);
  const completed = lesson.progress?.completed;

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-white">
      <CourseOutline
        modules={modules}
        currentLessonId={id}
        subjectCode={subject.code}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Video hero — Coursera style */}
        <div className="bg-black">
          <LessonVideoPlayer
            lesson={lesson}
            token={token}
            initialPosition={lesson.progress?.lastPosition ?? 0}
            onProgress={saveVideoProgress}
          />
        </div>

        {/* Lesson header + tabs */}
        <div className="border-b bg-white px-4 py-4 md:px-8">
          <nav className="mb-3 flex items-center gap-2 text-sm text-slate-500 lg:hidden">
            <Link href="/learn" className="hover:text-efundo-primary">
              Lessons
            </Link>
            <span>/</span>
            <span>{subject.code}</span>
          </nav>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium text-efundo-primary">
                {lesson.topic.module.title} · {lesson.topic.title}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{lesson.title}</h1>
              {lesson.summary && (
                <p className="mt-2 max-w-3xl text-slate-600">{lesson.summary}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={`/assistant?lessonId=${id}`}
                className="rounded-lg border border-efundo-primary/30 bg-efundo-primary/5 px-3 py-2 text-sm font-medium text-efundo-primary hover:bg-efundo-primary/10"
              >
                Ask AI tutor
              </Link>
              <span className="text-sm text-slate-500">
                {lesson.durationMinutes} min
                {isVideoLesson ? ' video' : ' read'}
              </span>
              {token && (
                <button
                  type="button"
                  onClick={() =>
                    progressMutation.mutate({
                      percentComplete: 100,
                      completed: !completed,
                    })
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-efundo-primary text-white hover:opacity-90'
                  }`}
                >
                  {completed ? '✓ Completed' : 'Mark complete'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-1 border-b border-transparent">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === 'overview'
                  ? 'border-efundo-primary text-efundo-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab('readings')}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === 'readings'
                  ? 'border-efundo-primary text-efundo-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Readings & resources
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-3xl">
            {tab === 'overview' && (
              <div>
                {lesson.objectives.length > 0 && (
                  <section className="rounded-xl bg-blue-50 p-5">
                    <h2 className="font-semibold text-slate-900">What you&apos;ll learn</h2>
                    <ul className="mt-3 space-y-2">
                      {lesson.objectives.map((o) => (
                        <li key={o} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-green-600">✓</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {lesson.prerequisites.length > 0 && (
                  <section className="mt-6 rounded-xl border p-5">
                    <h2 className="font-semibold text-slate-900">Prerequisites</h2>
                    <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                      {lesson.prerequisites.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {lesson.author && (
                  <p className="mt-6 text-sm text-slate-500">
                    Instructor: {lesson.author.fullName}
                  </p>
                )}

                {!isVideoLesson && lesson.content.length > 0 && (
                  <article className="mt-8">
                    {lesson.content.map((block, i) => (
                      <ContentBlock key={i} block={block} />
                    ))}
                  </article>
                )}
              </div>
            )}

            {tab === 'readings' && (
              <article>
                {lesson.content.length > 0 ? (
                  lesson.content.map((block, i) => (
                    <ContentBlock key={i} block={block} />
                  ))
                ) : (
                  <p className="text-slate-500">
                    No supplementary readings for this lesson.
                  </p>
                )}
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
