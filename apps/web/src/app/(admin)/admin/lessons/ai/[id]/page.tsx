'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  getAiProject,
  uploadAiSource,
  removeAiSource,
  generateAiOutline,
  applyAiOutline,
  updateAiProject,
  formatAiStatus,
  formatSourceType,
  type GeneratedCourseOutline,
} from '@/lib/lesson-ai';
import {
  useAuthorGuard,
  AdminPageHeader,
  FormField,
  Input,
  SubmitButton,
  ErrorAlert,
} from '@/components/admin/AdminForms';

function formatBytes(n?: number | null) {
  if (!n) return '—';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function OutlinePreview({ outline }: { outline: GeneratedCourseOutline }) {
  return (
    <div className="space-y-6">
      {outline.overview && (
        <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          {outline.overview}
        </p>
      )}
      {outline.modules.map((mod, mi) => (
        <div key={mi} className="rounded-xl border p-4">
          <h3 className="font-semibold text-slate-900">
            Module {mi + 1}: {mod.title}
          </h3>
          {mod.description && (
            <p className="mt-1 text-sm text-slate-500">{mod.description}</p>
          )}
          <div className="mt-4 space-y-3 pl-3 border-l-2 border-slate-200">
            {mod.topics?.map((topic, ti) => (
              <div key={ti}>
                <p className="font-medium text-slate-800">{topic.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {topic.lessons?.map((lesson, li) => (
                    <li key={li} className="flex gap-2">
                      <span className="text-slate-400">·</span>
                      <span>
                        {lesson.title}
                        <span className="text-slate-400">
                          {' '}
                          ({lesson.durationMinutes} min, {lesson.content?.length ?? 0} blocks)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AiProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const user = useAuthorGuard();
  const token = useAuthStore((s) => s.accessToken());
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['ai-project', id],
    queryFn: () => getAiProject(id, token!),
    enabled: !!id && !!token,
    refetchInterval: (q) =>
      q.state.data?.status === 'PROCESSING' ? 3000 : false,
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setInstructions(project.instructions ?? '');
    }
  }, [project]);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['ai-project', id] }),
    [queryClient, id],
  );

  const saveMeta = useMutation({
    mutationFn: () =>
      updateAiProject(id, { title, instructions: instructions || undefined }, token!),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const generateMut = useMutation({
    mutationFn: () => generateAiOutline(id, token!),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const applyMut = useMutation({
    mutationFn: () => applyAiOutline(id, token!),
    onSuccess: (result) => {
      invalidate();
      router.push(`/admin/lessons?subject=${result.subjectId}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !token) return;
    setError('');
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadAiSource(id, file, token);
      }
      await invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveSource(sourceId: string) {
    if (!token) return;
    setError('');
    try {
      await removeAiSource(id, sourceId, token);
      await invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  }

  if (!user || isLoading || !project) {
    return <p className="py-12 text-center text-slate-500">Loading project…</p>;
  }

  const isProcessing = project.status === 'PROCESSING';
  const canGenerate =
    project.sources.length > 0 && !isProcessing && project.status !== 'APPLIED';
  const canApply = project.status === 'READY' && !!project.generatedOutline;

  return (
    <div>
      <AdminPageHeader
        title={project.title}
        description={`${project.subject.name} · ${formatAiStatus(project.status)}`}
        backHref="/admin/lessons/ai"
      />

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {project.errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {project.errorMessage}
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Extracting source material and generating your course outline. This may take a few
          minutes for videos…
        </div>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">1. Project settings</h2>
            <div className="mt-4 space-y-3">
              <FormField label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormField>
              <FormField label="AI instructions">
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  disabled={isProcessing}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                />
              </FormField>
              <button
                type="button"
                onClick={() => saveMeta.mutate()}
                disabled={saveMeta.isPending || isProcessing}
                className="text-sm font-medium text-efundo-primary hover:underline disabled:opacity-50"
              >
                Save settings
              </button>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">2. Source materials</h2>
            <p className="mt-1 text-sm text-slate-500">
              PDFs and videos (MP4, WebM). Content stays on your server; only extracted text
              is sent to the AI.
            </p>

            <div
              className="mt-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!isProcessing) void handleFiles(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,video/*"
                multiple
                className="hidden"
                disabled={isProcessing || uploading}
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <button
                type="button"
                disabled={isProcessing || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-semibold text-white hover:bg-efundo-primary-dark disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Choose files'}
              </button>
              <p className="mt-2 text-xs text-slate-400">or drag and drop here</p>
            </div>

            <ul className="mt-4 space-y-2">
              {project.sources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatSourceType(s.type)} · {formatBytes(s.fileSize)} · {s.status}
                    </p>
                    {s.errorMessage && (
                      <p className="text-xs text-red-600">{s.errorMessage}</p>
                    )}
                  </div>
                  {!isProcessing && project.status !== 'APPLIED' && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveSource(s.id)}
                      className="shrink-0 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">3. Generate & apply</h2>
            <div className="mt-4 flex flex-col gap-3">
              <SubmitButton
                type="button"
                loading={generateMut.isPending || isProcessing}
                disabled={!canGenerate}
                onClick={() => {
                  setError('');
                  generateMut.mutate();
                }}
              >
                Generate course outline
              </SubmitButton>

              <SubmitButton
                type="button"
                loading={applyMut.isPending}
                disabled={!canApply}
                onClick={() => {
                  setError('');
                  applyMut.mutate();
                }}
              >
                Apply as draft lessons
              </SubmitButton>

              {project.status === 'APPLIED' && (
                <Link
                  href={`/admin/lessons?subject=${project.subject.id}`}
                  className="text-center text-sm font-medium text-efundo-primary hover:underline"
                >
                  Open lesson tree →
                </Link>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="font-semibold text-slate-900">Generated outline preview</h2>
          {!project.generatedOutline ? (
            <p className="mt-6 text-sm text-slate-500">
              Upload sources and click &quot;Generate course outline&quot; to see modules,
              topics, and lessons here before applying them to the subject.
            </p>
          ) : (
            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">
              <OutlinePreview outline={project.generatedOutline} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
