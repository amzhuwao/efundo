'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getCatalog } from '@/lib/lms';
import { createAiProject, listAiProjects, formatAiStatus } from '@/lib/lesson-ai';
import {
  useAuthorGuard,
  AdminPageHeader,
  FormField,
  Input,
  SubmitButton,
  ErrorAlert,
} from '@/components/admin/AdminForms';

export default function AiCourseBuilderPage() {
  const user = useAuthorGuard();
  const token = useAuthStore((s) => s.accessToken());
  const router = useRouter();

  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['ai-projects'],
    queryFn: () => listAiProjects(undefined, token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAiProject(
        {
          subjectId,
          title,
          instructions: instructions || undefined,
        },
        token!,
      ),
    onSuccess: (project) => router.push(`/admin/lessons/ai/${project.id}`),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <AdminPageHeader
        title="AI course builder"
        description="Upload PDFs and videos, then generate structured lessons from your source material — similar to NotebookLM."
        backHref="/admin/lessons"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">New generation project</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a subject, upload sources on the next screen, then let AI draft modules,
            topics, and lessons you can review before publishing.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              createMutation.mutate();
            }}
          >
            {error && <ErrorAlert message={error} />}

            <FormField label="Subject">
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.programName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Project title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Cell Biology"
                required
              />
            </FormField>

            <FormField label="Instructions for AI (optional)">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="Audience level, focus areas, number of modules, assessment style…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </FormField>

            <SubmitButton loading={createMutation.isPending}>
              Create project & upload sources →
            </SubmitButton>
          </form>

          <p className="mt-4 text-xs text-slate-400">
            Requires OPENAI_API_KEY on the API server. Video sources are transcribed with
            Whisper; PDFs are text-extracted locally.
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent projects</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No AI projects yet.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/lessons/ai/${p.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-efundo-primary"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-500">
                        {p.subject.name} · {p.sources.length} source
                        {p.sources.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {formatAiStatus(p.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
