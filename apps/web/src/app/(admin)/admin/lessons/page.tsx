'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAuthorGuard,
  AdminPageHeader,
  FormField,
  Input,
  SubmitButton,
  ErrorAlert,
  slugify,
} from '@/components/admin/AdminForms';
import { getCatalog } from '@/lib/lms';
import {
  getModulesForManage,
  createModule,
  createTopic,
  createLesson,
  deleteModule,
  deleteTopic,
  deleteLesson,
  publishLesson,
} from '@/lib/lms';

export default function AdminLessonsPage() {
  const user = useAuthorGuard();
  const token = useAuthStore((s) => s.accessToken());
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [subjectId, setSubjectId] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [topicModuleId, setTopicModuleId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [lessonTopicId, setLessonTopicId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const subject = searchParams.get('subject');
    if (subject) setSubjectId(subject);
  }, [searchParams]);

  const { data: catalog = [] } = useQuery({
    queryKey: ['lms-catalog'],
    queryFn: getCatalog,
    enabled: !!user,
  });

  const subjects = catalog.flatMap((e) =>
    e.programs.flatMap((p) =>
      p.subjects.map((s) => ({
        ...s,
        programName: p.name,
        providerName: p.providerName,
        level: e.level,
      })),
    ),
  );

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['lms-manage', subjectId],
    queryFn: () => getModulesForManage(subjectId, token!),
    enabled: !!subjectId && !!token,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['lms-manage', subjectId] });

  const moduleMutation = useMutation({
    mutationFn: () =>
      createModule(
        subjectId,
        { title: moduleTitle, slug: slugify(moduleTitle) },
        token!,
      ),
    onSuccess: () => {
      setModuleTitle('');
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const topicMutation = useMutation({
    mutationFn: () =>
      createTopic(
        topicModuleId,
        { title: topicTitle, slug: slugify(topicTitle) },
        token!,
      ),
    onSuccess: () => {
      setTopicTitle('');
      setTopicModuleId('');
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const lessonMutation = useMutation({
    mutationFn: () =>
      createLesson(
        lessonTopicId,
        {
          title: lessonTitle,
          slug: slugify(lessonTitle),
          durationMinutes: 15,
        },
        token!,
      ),
    onSuccess: (data) => {
      setLessonTitle('');
      setLessonTopicId('');
      invalidate();
      router.push(`/admin/lessons/${data.id}/edit`);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!user) return null;

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  return (
    <div>
      <AdminPageHeader
        title="Lesson authoring"
        description="Build modules, topics, and lessons with video and readings — Coursera-style course structure."
        backHref="/admin"
      />

      <div className="mb-6">
        <Link
          href="/admin/lessons/ai"
          className="inline-flex items-center gap-2 rounded-xl border border-efundo-primary/30 bg-efundo-primary/5 px-4 py-3 text-sm font-medium text-efundo-primary hover:bg-efundo-primary/10"
        >
          <span aria-hidden>✨</span>
          AI course builder — generate lessons from PDFs &amp; videos
        </Link>
      </div>

      <ErrorAlert message={error} />

      <section className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
        <FormField label="Subject">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
                {s.providerName ? ` (${s.providerName})` : ''}
              </option>
            ))}
          </select>
        </FormField>
      </section>

      {subjectId && (
        <>
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <form
              className="rounded-xl border bg-white p-5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                moduleMutation.mutate();
              }}
            >
              <h3 className="font-semibold text-slate-900">Add module</h3>
              <p className="mt-1 text-xs text-slate-500">e.g. Week 1 — Introduction</p>
              <div className="mt-4">
                <Input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Module title"
                  required
                />
              </div>
              <div className="mt-4">
                <SubmitButton loading={moduleMutation.isPending}>Add module</SubmitButton>
              </div>
            </form>

            <form
              className="rounded-xl border bg-white p-5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                topicMutation.mutate();
              }}
            >
              <h3 className="font-semibold text-slate-900">Add topic</h3>
              <div className="mt-4 space-y-3">
                <select
                  value={topicModuleId}
                  onChange={(e) => setTopicModuleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Parent module…</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <Input
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Topic title"
                  required
                />
              </div>
              <div className="mt-4">
                <SubmitButton loading={topicMutation.isPending}>Add topic</SubmitButton>
              </div>
            </form>

            <form
              className="rounded-xl border bg-white p-5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                lessonMutation.mutate();
              }}
            >
              <h3 className="font-semibold text-slate-900">Add lesson</h3>
              <div className="mt-4 space-y-3">
                <select
                  value={lessonTopicId}
                  onChange={(e) => setLessonTopicId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Parent topic…</option>
                  {modules.flatMap((m) =>
                    m.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {m.title} → {t.title}
                      </option>
                    )),
                  )}
                </select>
                <Input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Lesson title"
                  required
                />
              </div>
              <div className="mt-4">
                <SubmitButton loading={lessonMutation.isPending}>
                  Create & edit lesson
                </SubmitButton>
              </div>
            </form>
          </div>

          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                {selectedSubject?.code} — {selectedSubject?.name}
              </h2>
              <p className="text-sm text-slate-500">Course content outline</p>
            </div>

            {isLoading ? (
              <p className="p-8 text-center text-slate-500">Loading…</p>
            ) : modules.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                No modules yet. Add your first module above.
              </p>
            ) : (
              <div className="divide-y">
                {modules.map((mod) => (
                  <div key={mod.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{mod.title}</h3>
                        {mod.description && (
                          <p className="mt-1 text-sm text-slate-500">{mod.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Delete this module and all its content?')) return;
                          await deleteModule(mod.id, token!);
                          invalidate();
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>

                    {mod.topics.map((topic) => (
                      <div key={topic.id} className="mt-4 ml-4 border-l-2 border-slate-100 pl-4">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-sm font-medium text-slate-800">{topic.title}</h4>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete this topic and all lessons?')) return;
                              await deleteTopic(topic.id, token!);
                              invalidate();
                            }}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>

                        <ul className="mt-2 space-y-1">
                          {topic.lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                    lesson.status === 'PUBLISHED'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {lesson.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                                </span>
                                <span className="text-sm text-slate-700">{lesson.title}</span>
                                {(lesson.videoKey || lesson.videoUrl) && (
                                  <span className="text-xs text-slate-400">▶ video</span>
                                )}
                              </div>
                              <div className="flex gap-3 text-xs">
                                <Link
                                  href={`/admin/lessons/${lesson.id}/edit`}
                                  className="text-efundo-primary hover:underline"
                                >
                                  Edit
                                </Link>
                                {lesson.status === 'PUBLISHED' ? (
                                  <button
                                    type="button"
                                    className="text-slate-500 hover:underline"
                                    onClick={async () => {
                                      await publishLesson(lesson.id, 'draft', token!);
                                      invalidate();
                                    }}
                                  >
                                    Unpublish
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="text-green-600 hover:underline"
                                    onClick={async () => {
                                      await publishLesson(lesson.id, 'publish', token!);
                                      invalidate();
                                    }}
                                  >
                                    Publish
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="text-red-600 hover:underline"
                                  onClick={async () => {
                                    if (!confirm('Delete this lesson?')) return;
                                    await deleteLesson(lesson.id, token!);
                                    invalidate();
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </li>
                          ))}
                          {topic.lessons.length === 0 && (
                            <li className="px-3 py-2 text-xs text-slate-400">No lessons yet</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
