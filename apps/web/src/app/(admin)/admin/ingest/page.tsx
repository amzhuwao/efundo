'use client';

import { useEffect, useMemo, useRef, useState, type InputHTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getHomeHref } from '@/lib/roles';
import {
  AdminPageHeader,
  ErrorAlert,
  SuccessAlert,
} from '@/components/admin/AdminForms';
import {
  RESOURCE_TYPES,
  classifyIngestPdf,
  createResource,
  uploadResourceFile,
  submitResource,
  moderateResource,
  type IngestClassification,
} from '@/lib/library';
import { getPrograms } from '@/lib/curriculum';
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
  type Program,
  type Subject,
} from '@efundo/shared-types';

const UPLOAD_ROLES = [
  'SUPER_ADMIN',
  'INSTITUTION_ADMIN',
  'LECTURER',
  'MODERATOR',
];

type RowStatus = 'pending' | 'classifying' | 'ready' | 'error' | 'uploading' | 'done';

type IngestRow = {
  id: string;
  file: File;
  selected: boolean;
  status: RowStatus;
  error?: string;
  type: string;
  title: string;
  description: string;
  author: string;
  year: string;
  semester: string;
  educationLevel: EducationLevel | '';
  programId: string;
  subjectId: string;
  tags: string;
  confidence: number;
  rationale: string;
  textPreview: string;
  uploadedId?: string;
};

function matchSubject(
  programs: Program[],
  code?: string | null,
  name?: string | null,
  level?: string | null,
): { programId: string; subjectId: string; educationLevel: EducationLevel | '' } {
  const codeNorm = code?.trim().toLowerCase() ?? '';
  const nameNorm = name?.trim().toLowerCase() ?? '';
  const levelFilter = level as EducationLevel | undefined;

  const candidates = programs.filter(
    (p) => !levelFilter || p.level === levelFilter,
  );

  for (const program of candidates) {
    const subjects = (program.subjects ?? []) as Subject[];
    const byCode = subjects.find(
      (s) => s.code.toLowerCase() === codeNorm && codeNorm.length > 0,
    );
    if (byCode) {
      return {
        programId: program.id,
        subjectId: byCode.id,
        educationLevel: program.level,
      };
    }
  }

  for (const program of candidates) {
    const subjects = (program.subjects ?? []) as Subject[];
    const byName = subjects.find(
      (s) =>
        nameNorm.length > 2 &&
        (s.name.toLowerCase().includes(nameNorm) ||
          nameNorm.includes(s.name.toLowerCase())),
    );
    if (byName) {
      return {
        programId: program.id,
        subjectId: byName.id,
        educationLevel: program.level,
      };
    }
  }

  return {
    programId: '',
    subjectId: '',
    educationLevel: (levelFilter as EducationLevel) || '',
  };
}

function applyClassification(file: File, c: IngestClassification, programs: Program[]): IngestRow {
  const matched = matchSubject(
    programs,
    c.suggestedSubjectCode,
    c.suggestedSubjectName,
    c.educationLevel,
  );
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    selected: true,
    status: 'ready',
    type: c.type || 'LECTURE_NOTE',
    title: c.title,
    description: c.description ?? '',
    author: c.author ?? '',
    year: c.year != null ? String(c.year) : '',
    semester: c.semester != null ? String(c.semester) : '',
    educationLevel: matched.educationLevel || (c.educationLevel as EducationLevel) || '',
    programId: matched.programId,
    subjectId: matched.subjectId,
    tags: (c.tags ?? []).join(', '),
    confidence: c.confidence,
    rationale: c.rationale ?? '',
    textPreview: c.textPreview,
  };
}

export default function AdminIngestPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const token = accessToken();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<IngestRow[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (!UPLOAD_ROLES.includes(user.role)) {
      router.replace(getHomeHref(user.role));
    }
  }, [user, router]);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs-all-ingest'],
    queryFn: () => getPrograms(),
    enabled: !!user,
  });

  const canPublish = user?.role === 'SUPER_ADMIN' || user?.role === 'INSTITUTION_ADMIN';

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selected && r.status === 'ready').length,
    [rows],
  );

  function updateRow(id: string, patch: Partial<IngestRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const liveToken = useAuthStore.getState().accessToken() ?? token;
    if (!liveToken) {
      setError('You are not signed in. Log in again, then retry.');
      router.replace('/login');
      return;
    }
    setError('');
    setSuccess('');

    const pdfs = Array.from(fileList).filter(
      (f) =>
        f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    if (pdfs.length === 0) {
      setError('No PDF files found in the selected folder.');
      return;
    }

    const placeholders: IngestRow[] = pdfs.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      selected: true,
      status: 'pending',
      type: 'LECTURE_NOTE',
      title: file.name.replace(/\.pdf$/i, ''),
      description: '',
      author: '',
      year: '',
      semester: '',
      educationLevel: '',
      programId: '',
      subjectId: '',
      tags: '',
      confidence: 0,
      rationale: '',
      textPreview: '',
    }));
    setRows(placeholders);
    setClassifying(true);
    let classified = 0;

    for (let i = 0; i < pdfs.length; i++) {
      const file = pdfs[i];
      setProgress(`Classifying ${i + 1} of ${pdfs.length}: ${file.name}`);
      setRows((prev) =>
        prev.map((r) =>
          r.file === file ? { ...r, status: 'classifying' as RowStatus } : r,
        ),
      );
      try {
        const classification = await classifyIngestPdf(file, liveToken);
        classified++;
        setRows((prev) =>
          prev.map((r) =>
            r.file === file
              ? applyClassification(file, classification, programs)
              : r,
          ),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Classification failed';
        const friendly =
          message === 'Unauthorized' || /unauthorized/i.test(message)
            ? 'Session expired — log out and log back in, then retry.'
            : message;
        setRows((prev) =>
          prev.map((r) =>
            r.file === file
              ? { ...r, status: 'error' as RowStatus, error: friendly, selected: false }
              : r,
          ),
        );
      }
    }

    setClassifying(false);
    setProgress('');
    setSuccess(
      `Classified ${classified} of ${pdfs.length} PDF${pdfs.length === 1 ? '' : 's'}. Review and upload.`,
    );
  }

  async function handleUpload() {
    const liveToken = useAuthStore.getState().accessToken() ?? token;
    if (!liveToken) {
      setError('You are not signed in. Log in again, then retry.');
      router.replace('/login');
      return;
    }
    const toUpload = rows.filter((r) => r.selected && r.status === 'ready');
    if (toUpload.length === 0) {
      setError('Select at least one classified resource to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    let done = 0;

    for (const row of toUpload) {
      updateRow(row.id, { status: 'uploading', error: undefined });
      setProgress(`Uploading ${done + 1} of ${toUpload.length}: ${row.title}`);
      try {
        const resource = await createResource(
          {
            title: row.title.trim(),
            type: row.type,
            description: row.description.trim() || undefined,
            author: row.author.trim() || undefined,
            year: row.year ? Number(row.year) : undefined,
            semester: row.semester ? Number(row.semester) : undefined,
            programId: row.programId || undefined,
            subjectId: row.subjectId || undefined,
            tags: row.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          },
          liveToken,
        );
        await uploadResourceFile(resource.id, row.file, liveToken);
        await submitResource(resource.id, liveToken);
        if (autoPublish && canPublish) {
          await moderateResource(resource.id, 'publish', liveToken);
        }
        done++;
        updateRow(row.id, {
          status: 'done',
          selected: false,
          uploadedId: resource.id,
        });
      } catch (e) {
        updateRow(row.id, {
          status: 'ready',
          error: e instanceof Error ? e.message : 'Upload failed',
        });
      }
    }

    setUploading(false);
    setProgress('');
    setSuccess(
      `Uploaded ${done} of ${toUpload.length} resource${toUpload.length === 1 ? '' : 's'}${
        autoPublish && canPublish ? ' (published)' : ' (submitted for moderation)'
      }.`,
    );
  }

  if (!user || !UPLOAD_ROLES.includes(user.role)) return null;

  return (
    <div>
      <AdminPageHeader
        title="PDF ingest"
        description="Point at a local folder of PDFs. AI classifies each file; you review, then upload to the library."
        backHref="/admin"
      />

      <div className="mb-6 space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Use Chrome or Edge. Choose a folder containing PDFs. Requires{' '}
          <code className="rounded bg-slate-100 px-1">GEMINI_API_KEY</code> in
          the API env.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as InputHTMLAttributes<HTMLInputElement>)}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <button
            type="button"
            disabled={classifying || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark disabled:opacity-50"
          >
            {classifying ? 'Classifying…' : 'Choose PDF folder'}
          </button>
          {canPublish && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                disabled={uploading}
              />
              Auto-publish after upload
            </label>
          )}
          <button
            type="button"
            disabled={classifying || uploading || selectedCount === 0}
            onClick={handleUpload}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {uploading
              ? 'Uploading…'
              : `Upload selected (${selectedCount})`}
          </button>
        </div>
        {progress && <p className="text-sm text-slate-500">{progress}</p>}
        <ErrorAlert message={error} />
        <SuccessAlert message={success} />
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-slate-500">No files selected yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <IngestRowCard
              key={row.id}
              row={row}
              programs={programs}
              disabled={classifying || uploading}
              onChange={(patch) => updateRow(row.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IngestRowCard({
  row,
  programs,
  disabled,
  onChange,
}: {
  row: IngestRow;
  programs: Program[];
  disabled: boolean;
  onChange: (patch: Partial<IngestRow>) => void;
}) {
  const filteredPrograms = row.educationLevel
    ? programs.filter((p) => p.level === row.educationLevel)
    : programs;
  const selectedProgram = programs.find((p) => p.id === row.programId);
  const subjects = (selectedProgram?.subjects ?? []) as Subject[];

  const statusColor =
    row.status === 'done'
      ? 'text-green-700'
      : row.status === 'error'
        ? 'text-red-700'
        : row.status === 'classifying' || row.status === 'uploading'
          ? 'text-amber-700'
          : 'text-slate-500';

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={row.selected}
            disabled={disabled || row.status !== 'ready'}
            onChange={(e) => onChange({ selected: e.target.checked })}
            className="mt-1"
          />
          <div>
            <p className="font-medium text-slate-900">{row.file.name}</p>
            <p className={`text-xs ${statusColor}`}>
              {row.status}
              {row.confidence > 0
                ? ` · confidence ${Math.round(row.confidence * 100)}%`
                : ''}
              {row.rationale ? ` · ${row.rationale}` : ''}
            </p>
            {row.error && (
              <p className="mt-1 text-sm text-red-600">{row.error}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Type</span>
          <select
            value={row.type}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-slate-600">Title</span>
          <input
            value={row.title}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Level</span>
          <select
            value={row.educationLevel}
            disabled={disabled || row.status === 'done'}
            onChange={(e) =>
              onChange({
                educationLevel: e.target.value as EducationLevel | '',
                programId: '',
                subjectId: '',
              })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Any / unset</option>
            {(Object.keys(EDUCATION_LEVEL_LABELS) as EducationLevel[]).map(
              (level) => (
                <option key={level} value={level}>
                  {EDUCATION_LEVEL_LABELS[level]}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Program</span>
          <select
            value={row.programId}
            disabled={disabled || row.status === 'done'}
            onChange={(e) =>
              onChange({ programId: e.target.value, subjectId: '' })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">No program</option>
            {filteredPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.providerName ? ` (${p.providerName})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Subject</span>
          <select
            value={row.subjectId}
            disabled={disabled || row.status === 'done' || !row.programId}
            onChange={(e) => onChange({ subjectId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Year</span>
          <input
            type="number"
            value={row.year}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ year: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Semester</span>
          <select
            value={row.semester}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ semester: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">—</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Author</span>
          <input
            value={row.author}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ author: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm md:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-slate-600">Description</span>
          <textarea
            value={row.description}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm md:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-slate-600">Tags (comma-separated)</span>
          <input
            value={row.tags}
            disabled={disabled || row.status === 'done'}
            onChange={(e) => onChange({ tags: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      {row.textPreview && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-slate-500">
            Text preview
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap">
            {row.textPreview}
          </pre>
        </details>
      )}
    </div>
  );
}
