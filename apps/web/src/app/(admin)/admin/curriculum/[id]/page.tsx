'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAdminGuard,
  AdminPageHeader,
  FormField,
  Input,
  SubmitButton,
  ErrorAlert,
  SuccessAlert,
  slugify,
} from '@/components/admin/AdminForms';
import {
  EDUCATION_LEVEL_LABELS,
  type Program,
  type Subject,
} from '@efundo/shared-types';
import {
  archiveProgram,
  createSubject,
  deleteSubject,
  getProgram,
  updateProgram,
  updateSubject,
} from '@/lib/curriculum';

export default function AdminProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [progName, setProgName] = useState('');
  const [progSlug, setProgSlug] = useState('');
  const [providerName, setProviderName] = useState('');
  const [formOrGrade, setFormOrGrade] = useState('');
  const [durationYears, setDurationYears] = useState('');

  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subYear, setSubYear] = useState('');

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', id],
    queryFn: () => getProgram(id),
    enabled: !!user && !!id,
  });

  useEffect(() => {
    if (!program) return;
    const p = program as Program;
    setProgName(p.name);
    setProgSlug(p.slug);
    setProviderName(p.providerName ?? '');
    setFormOrGrade(p.formOrGrade != null ? String(p.formOrGrade) : '');
    setDurationYears(p.durationYears != null ? String(p.durationYears) : '');
  }, [program]);

  async function saveProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProgram(
        id,
        {
          name: progName,
          slug: progSlug || slugify(progName),
          providerName: providerName || undefined,
          formOrGrade: formOrGrade ? Number(formOrGrade) : undefined,
          durationYears: durationYears ? Number(durationYears) : undefined,
        },
        token,
      );
      setSuccess('Program updated');
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    if (!token || !program) return;
    if (!confirm(`Archive "${(program as Program).name}"?`)) return;
    try {
      await archiveProgram(id, token);
      router.push('/admin/curriculum');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createSubject(
        id,
        {
          name: subName,
          code: subCode,
          year: subYear ? Number(subYear) : undefined,
        },
        token,
      );
      setSuccess('Subject added');
      setSubName('');
      setSubCode('');
      setSubYear('');
      queryClient.invalidateQueries({ queryKey: ['program', id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function saveSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !editingSubject) return;
    setLoading(true);
    setError('');
    try {
      await updateSubject(
        editingSubject.id,
        {
          name: subName,
          code: subCode,
          year: subYear ? Number(subYear) : undefined,
        },
        token,
      );
      setSuccess('Subject updated');
      setEditingSubject(null);
      setSubName('');
      setSubCode('');
      setSubYear('');
      queryClient.invalidateQueries({ queryKey: ['program', id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSubject(subject: Subject) {
    if (!token) return;
    if (!confirm(`Delete "${subject.name}"? This also removes linked lessons and resources.`)) {
      return;
    }
    try {
      await deleteSubject(subject.id, token);
      setSuccess('Subject deleted');
      queryClient.invalidateQueries({ queryKey: ['program', id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  function startEditSubject(s: Subject) {
    setEditingSubject(s);
    setSubName(s.name);
    setSubCode(s.code);
    setSubYear(s.year != null ? String(s.year) : '');
    setSuccess('');
    setError('');
  }

  if (!user) return null;
  if (isLoading || !program) {
    return <p className="p-8 text-slate-500">Loading...</p>;
  }

  const p = program as Program;

  return (
    <div>
      <AdminPageHeader
        title={p.name}
        description={`${EDUCATION_LEVEL_LABELS[p.level]} · ${p.providerName ?? p.slug}`}
        backHref="/admin/curriculum"
      />

      {(error || success) && (
        <div className="mt-4 space-y-2">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      )}

      <section className="mt-8 rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Program details</h2>
          <div className="flex gap-2">
            {!editMode && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="text-sm text-efundo-primary hover:underline"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleArchive}
              className="text-sm text-red-600 hover:underline"
            >
              Archive
            </button>
          </div>
        </div>

        {editMode ? (
          <form onSubmit={saveProgram} className="mt-4 space-y-4">
            <FormField label="Name">
              <Input
                value={progName}
                onChange={(e) => setProgName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Slug">
              <Input
                value={progSlug}
                onChange={(e) => setProgSlug(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Provider">
              <Input
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Form / grade">
                <Input
                  type="number"
                  value={formOrGrade}
                  onChange={(e) => setFormOrGrade(e.target.value)}
                />
              </FormField>
              <FormField label="Duration (years)">
                <Input
                  type="number"
                  value={durationYears}
                  onChange={(e) => setDurationYears(e.target.value)}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <SubmitButton loading={loading}>Save changes</SubmitButton>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="text-sm text-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Slug</dt>
              <dd>{p.slug}</dd>
            </div>
            {p.providerName && (
              <div>
                <dt className="text-slate-500">Provider</dt>
                <dd>{p.providerName}</dd>
              </div>
            )}
            {p.formOrGrade != null && (
              <div>
                <dt className="text-slate-500">Form / grade</dt>
                <dd>{p.formOrGrade}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Subjects</h2>
        <ul className="mt-4 divide-y">
          {(p.subjects ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span>
                <span className="font-medium">{s.code}</span> — {s.name}
                {s.year != null && (
                  <span className="ml-2 text-slate-400">Year {s.year}</span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditSubject(s)}
                  className="text-efundo-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(s)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form
          onSubmit={editingSubject ? saveSubject : addSubject}
          className="mt-6 space-y-4 border-t pt-6"
        >
          <h3 className="text-sm font-medium">
            {editingSubject ? `Edit ${editingSubject.code}` : 'Add subject'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Name">
              <Input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Code">
              <Input
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Year (optional)">
              <Input
                type="number"
                value={subYear}
                onChange={(e) => setSubYear(e.target.value)}
              />
            </FormField>
          </div>
          <div className="flex gap-3">
            <SubmitButton loading={loading}>
              {editingSubject ? 'Update subject' : 'Add subject'}
            </SubmitButton>
            {editingSubject && (
              <button
                type="button"
                onClick={() => {
                  setEditingSubject(null);
                  setSubName('');
                  setSubCode('');
                  setSubYear('');
                }}
                className="text-sm text-slate-500"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
