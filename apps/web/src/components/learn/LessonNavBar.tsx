'use client';

import Link from 'next/link';

export interface LessonNeighbor {
  id: string;
  title: string;
}

export function LessonNavBar({
  subject,
  moduleTitle,
  topicTitle,
  lessonTitle,
  prevLesson,
  nextLesson,
  onToggleOutline,
}: {
  subject: { id: string; code: string; name: string };
  moduleTitle: string;
  topicTitle: string;
  lessonTitle: string;
  prevLesson: LessonNeighbor | null;
  nextLesson: LessonNeighbor | null;
  onToggleOutline?: () => void;
}) {
  return (
    <div className="sticky top-14 z-10 border-b bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onToggleOutline}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          Contents
        </button>

        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm text-slate-500 sm:flex"
        >
          <Link href="/learn" className="shrink-0 hover:text-efundo-primary">
            Lessons
          </Link>
          <span className="shrink-0 text-slate-300">/</span>
          <Link
            href={`/learn?subject=${subject.id}`}
            className="shrink-0 hover:text-efundo-primary"
          >
            {subject.code}
          </Link>
          <span className="shrink-0 text-slate-300">/</span>
          <span className="truncate">{moduleTitle}</span>
          <span className="shrink-0 text-slate-300">/</span>
          <span className="truncate font-medium text-slate-800">{lessonTitle}</span>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {prevLesson ? (
            <Link
              href={`/learn/lessons/${prevLesson.id}`}
              className="inline-flex max-w-[10rem] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:max-w-[14rem]"
              title={prevLesson.title}
            >
              <span aria-hidden>←</span>
              <span className="truncate">{prevLesson.title}</span>
            </Link>
          ) : (
            <span className="hidden rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-300 sm:inline">
              ← First lesson
            </span>
          )}

          {nextLesson ? (
            <Link
              href={`/learn/lessons/${nextLesson.id}`}
              className="inline-flex max-w-[10rem] items-center gap-1 rounded-lg bg-efundo-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-efundo-primary-dark sm:max-w-[14rem]"
              title={nextLesson.title}
            >
              <span className="truncate">{nextLesson.title}</span>
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link
              href={`/learn?subject=${subject.id}`}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Finish course
            </Link>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-2 sm:hidden">
        <p className="truncate text-sm font-medium text-slate-900">{lessonTitle}</p>
        <p className="truncate text-xs text-slate-500">
          {subject.code} · {moduleTitle} · {topicTitle}
        </p>
      </div>
    </div>
  );
}
