'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  lessonVideoUrl,
  embedVideoUrl,
  formatDifficulty,
  type LessonBlock,
  type LessonDetail,
  type ModuleWithTopics,
} from '@/lib/lms';

export function CourseOutline({
  modules,
  currentLessonId,
  subjectCode,
  subjectName,
  mobileOpen = false,
  onClose,
}: {
  modules: ModuleWithTopics[];
  currentLessonId: string;
  subjectCode: string;
  subjectName?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between border-b px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Course content
          </p>
          <p className="mt-1 font-semibold text-slate-900">{subjectCode}</p>
          {subjectName && (
            <p className="mt-0.5 text-xs text-slate-500">{subjectName}</p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close course outline"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <nav className="p-2">
        {modules.map((mod) => (
          <div key={mod.id} className="mb-4">
            <p className="px-2 py-1 text-xs font-semibold text-slate-500">{mod.title}</p>
            {mod.topics.map((topic) => (
              <div key={topic.id} className="ml-1">
                <p className="px-2 py-1 text-[11px] text-slate-400">{topic.title}</p>
                <ul>
                  {topic.lessons.map((lesson) => {
                    const active = lesson.id === currentLessonId;
                    const done = lesson.progress?.completed;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/lessons/${lesson.id}`}
                          onClick={onClose}
                          className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm transition ${
                            active
                              ? 'bg-blue-50 font-medium text-efundo-primary'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="mt-0.5 text-xs">
                            {done ? '✓' : lesson.videoKey || lesson.videoUrl ? '▶' : '◦'}
                          </span>
                          <span className="line-clamp-2">{lesson.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r bg-white lg:block">
        {content}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close course outline"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform overflow-y-auto border-r bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}

export function LessonVideoPlayer({
  lesson,
  token,
  onProgress,
  initialPosition = 0,
}: {
  lesson: LessonDetail;
  token?: string | null;
  onProgress?: (seconds: number, percent: number) => void;
  initialPosition?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blobSrc, setBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!lesson.videoKey) return;
    if (lesson.status === 'PUBLISHED') return;

    let url: string | null = null;
    fetch(lessonVideoUrl(lesson.id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((b) => {
        url = URL.createObjectURL(b);
        setBlobSrc(url);
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [lesson.id, lesson.videoKey, lesson.status, token]);

  if (lesson.videoUrl) {
    const embed = embedVideoUrl(lesson.videoUrl);
    if (embed.includes('youtube.com/embed') || embed.includes('vimeo.com')) {
      return (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embed}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <video
        ref={videoRef}
        src={lesson.videoUrl}
        controls
        className="aspect-video w-full bg-black"
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v || !v.duration) return;
          onProgress?.(v.currentTime, Math.round((v.currentTime / v.duration) * 100));
        }}
      />
    );
  }

  if (lesson.videoKey) {
    const src =
      lesson.status === 'PUBLISHED' ? lessonVideoUrl(lesson.id) : blobSrc;
    if (!src) {
      return (
        <div className="flex aspect-video items-center justify-center bg-slate-900 text-slate-400">
          Loading video…
        </div>
      );
    }
    return (
      <video
        ref={videoRef}
        src={src}
        controls
        className="aspect-video w-full bg-black"
        onLoadedMetadata={() => {
          if (initialPosition > 0 && videoRef.current) {
            videoRef.current.currentTime = initialPosition;
          }
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v || !v.duration) return;
          onProgress?.(v.currentTime, Math.round((v.currentTime / v.duration) * 100));
        }}
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="text-center text-slate-300">
        <p className="text-4xl">📖</p>
        <p className="mt-2 text-sm">Reading lesson — no video</p>
      </div>
    </div>
  );
}

export function ContentBlock({ block }: { block: LessonBlock }) {
  if (block.type === 'heading') {
    return <h2 className="mt-8 text-xl font-semibold text-slate-900">{block.text}</h2>;
  }
  if (block.type === 'paragraph') {
    return <p className="mt-4 leading-relaxed text-slate-700">{block.text}</p>;
  }
  if (block.type === 'list' && block.items) {
    return (
      <ul className="mt-4 list-inside list-disc space-y-1 text-slate-700">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'code' && block.text) {
    return (
      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
        <code>{block.text}</code>
      </pre>
    );
  }
  if (block.type === 'video' && block.videoUrl) {
    const embed = embedVideoUrl(block.videoUrl);
    if (embed.includes('embed') || embed.includes('player')) {
      return (
        <figure className="mt-6">
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <iframe
              src={embed}
              title={block.caption ?? 'Video'}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-slate-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    return (
      <figure className="mt-6">
        <video src={block.videoUrl} controls className="w-full rounded-lg" />
        {block.caption && (
          <figcaption className="mt-2 text-center text-sm text-slate-500">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }
  return null;
}
