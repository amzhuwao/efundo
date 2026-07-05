'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAuthorGuard,
  AdminPageHeader,
  FormField,
  Input,
  Select,
  SubmitButton,
  ErrorAlert,
  SuccessAlert,
  slugify,
} from '@/components/admin/AdminForms';
import {
  getLessonForManage,
  updateLesson,
  publishLesson,
  uploadLessonVideo,
  lessonVideoUrl,
  type LessonBlock,
} from '@/lib/lms';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

function linesToArray(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function arrayToLines(arr: string[]) {
  return arr.join('\n');
}

export default function LessonEditPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthorGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [objectivesText, setObjectivesText] = useState('');
  const [prerequisitesText, setPrerequisitesText] = useState('');
  const [content, setContent] = useState<LessonBlock[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson-manage', id],
    queryFn: () => getLessonForManage(id, token!),
    enabled: !!id && !!token,
  });

  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title);
    setSlug(lesson.slug);
    setSummary(lesson.summary ?? '');
    setVideoUrl(lesson.videoUrl ?? '');
    setDurationMinutes(lesson.durationMinutes);
    setDifficulty(lesson.difficulty);
    setObjectivesText(arrayToLines(lesson.objectives));
    setPrerequisitesText(arrayToLines(lesson.prerequisites));
    setContent(lesson.content ?? []);
  }, [lesson]);

  useEffect(() => {
    if (!lesson?.videoKey || !token) return;
    let revoked: string | null = null;
    fetch(lessonVideoUrl(id), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        revoked = URL.createObjectURL(blob);
        setPreviewSrc(revoked);
      })
      .catch(() => {});
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [lesson?.videoKey, id, token]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateLesson(
        id,
        {
          title,
          slug,
          summary,
          videoUrl: videoUrl || undefined,
          durationMinutes,
          difficulty,
          objectives: linesToArray(objectivesText),
          prerequisites: linesToArray(prerequisitesText),
          content,
        },
        token!,
      );
      if (videoFile) {
        await uploadLessonVideo(id, videoFile, token!);
      }
    },
    onSuccess: () => {
      setSuccess('Lesson saved.');
      setVideoFile(null);
      queryClient.invalidateQueries({ queryKey: ['lesson-manage', id] });
      queryClient.invalidateQueries({ queryKey: ['lms-manage'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: (action: 'publish' | 'draft') =>
      publishLesson(id, action, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-manage', id] });
      setSuccess('Publish status updated.');
    },
    onError: (e: Error) => setError(e.message),
  });

  function addBlock(type: LessonBlock['type']) {
    if (type === 'list') {
      setContent([...content, { type, items: [''] }]);
    } else if (type === 'video') {
      setContent([...content, { type, videoUrl: '', caption: '' }]);
    } else {
      setContent([...content, { type, text: '' }]);
    }
  }

  function updateBlock(index: number, block: LessonBlock) {
    const next = [...content];
    next[index] = block;
    setContent(next);
  }

  function removeBlock(index: number) {
    setContent(content.filter((_, i) => i !== index));
  }

  if (!user) return null;

  if (isLoading) {
    return <p className="p-8 text-center text-slate-500">Loading lesson…</p>;
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Lesson not found.</p>
        <Link href="/admin/lessons" className="mt-4 inline-block text-efundo-primary">
          ← Back
        </Link>
      </div>
    );
  }

  const subject = lesson.topic.module.subject;

  return (
    <div className="p-4 md:p-8">
      <AdminPageHeader
        title={`Edit: ${lesson.title}`}
        description={`${subject.code} · ${lesson.topic.module.title} · ${lesson.topic.title}`}
        backHref="/admin/lessons"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            lesson.status === 'PUBLISHED'
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {lesson.status}
        </span>
        {lesson.status === 'PUBLISHED' ? (
          <>
            <button
              type="button"
              onClick={() => publishMutation.mutate('draft')}
              className="text-sm text-slate-600 hover:underline"
            >
              Unpublish
            </button>
            <Link
              href={`/learn/lessons/${id}`}
              className="text-sm text-efundo-primary hover:underline"
            >
              View as student →
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={() => publishMutation.mutate('publish')}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white"
          >
            Publish lesson
          </button>
        )}
      </div>

      <ErrorAlert message={error} />
      <SuccessAlert message={success} />

      <form
        className="grid gap-8 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          setSuccess('');
          saveMutation.mutate();
        }}
      >
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Lesson details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Title">
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug || slug === slugify(title)) setSlug(slugify(e.target.value));
                  }}
                  required
                />
              </FormField>
              <FormField label="Slug">
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </FormField>
              <FormField label="Duration (minutes)">
                <Input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </FormField>
              <FormField label="Difficulty">
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Summary">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Primary video</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload a video file or paste a YouTube/Vimeo URL (Coursera-style lecture video).
            </p>

            {(previewSrc || lesson.videoKey) && (
              <div className="mt-4 overflow-hidden rounded-lg bg-black">
                <video
                  src={previewSrc ?? lessonVideoUrl(id)}
                  controls
                  className="aspect-video w-full"
                />
              </div>
            )}
            {lesson.videoFileName && (
              <p className="mt-2 text-xs text-slate-500">
                Current file: {lesson.videoFileName}
                {lesson.videoSize
                  ? ` (${Math.round(lesson.videoSize / 1024 / 1024)} MB)`
                  : ''}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <FormField label="Upload video (MP4, WebM — max 500MB)">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
              </FormField>
              <FormField label="Or external video URL">
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Reading & resources</h2>
              <div className="flex flex-wrap gap-2">
                {(['heading', 'paragraph', 'list', 'code', 'video'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addBlock(t)}
                    className="rounded border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {content.map((block, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">
                      {block.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBlock(i)}
                      className="text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  {block.type === 'list' ? (
                    <textarea
                      value={(block.items ?? []).join('\n')}
                      onChange={(e) =>
                        updateBlock(i, {
                          ...block,
                          items: linesToArray(e.target.value),
                        })
                      }
                      rows={4}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="One item per line"
                    />
                  ) : block.type === 'video' ? (
                    <div className="space-y-2">
                      <Input
                        value={block.videoUrl ?? ''}
                        onChange={(e) =>
                          updateBlock(i, { ...block, videoUrl: e.target.value })
                        }
                        placeholder="Video URL (YouTube, Vimeo, or direct link)"
                      />
                      <Input
                        value={block.caption ?? ''}
                        onChange={(e) =>
                          updateBlock(i, { ...block, caption: e.target.value })
                        }
                        placeholder="Caption (optional)"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={block.text ?? ''}
                      onChange={(e) =>
                        updateBlock(i, { ...block, text: e.target.value })
                      }
                      rows={block.type === 'code' ? 6 : 3}
                      className={`w-full rounded border px-3 py-2 text-sm ${
                        block.type === 'code' ? 'font-mono' : ''
                      }`}
                    />
                  )}
                </div>
              ))}
              {content.length === 0 && (
                <p className="text-sm text-slate-400">
                  Add headings, paragraphs, lists, code, or embedded videos below the main lecture.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <FormField label="Learning objectives (one per line)">
              <textarea
                value={objectivesText}
                onChange={(e) => setObjectivesText(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </FormField>
            <div className="mt-4">
              <FormField label="Prerequisites (one per line)">
                <textarea
                  value={prerequisitesText}
                  onChange={(e) => setPrerequisitesText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </FormField>
            </div>
          </section>

          <SubmitButton loading={saveMutation.isPending}>
            Save lesson
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
