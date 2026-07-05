'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  type EducationLevel,
  type Program,
} from '@efundo/shared-types';
import {
  archiveProgram,
  createProgram,
  getPrograms,
  programUnitLabel,
  updateProgram,
  usesFormOrGrade,
  usesProvider,
} from '@/lib/curriculum';

export default function AdminCurriculumPage() {
  const router = useRouter();
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();

  const [level, setLevel] = useState<EducationLevel>('PRIMARY');
  const [editing, setEditing] = useState<Program | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [providerName, setProviderName] = useState('');
  const [formOrGrade, setFormOrGrade] = useState('');
  const [durationYears, setDurationYears] = useState('');
  const [orderIndex, setOrderIndex] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const unitLabel = programUnitLabel(level);
  const showGradeField = usesFormOrGrade(level);
  const showProviderField = usesProvider(level);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['admin-programs', level],
    queryFn: () => getPrograms(level),
    enabled: !!user,
  });

  function resetForm() {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setProviderName('');
    setFormOrGrade('');
    setDurationYears('');
    setOrderIndex('');
  }

  function suggestNameFromGrade(grade: string) {
    if (!showGradeField || !grade) return;
    const n = Number(grade);
    if (!Number.isFinite(n)) return;
    const suggested =
      level === 'PRIMARY'
        ? `Grade ${n}`
        : level === 'O_LEVEL'
          ? `Form ${n}`
          : `Upper ${n === 6 ? 'Six' : `Form ${n}`}`;
    setName(suggested);
    setSlug(slugify(suggested));
    if (!orderIndex) setOrderIndex(grade);
  }

  function startEdit(program: Program) {
    setEditing(program);
    setName(program.name);
    setSlug(program.slug);
    setDescription(program.description ?? '');
    setProviderName(program.providerName ?? '');
    setFormOrGrade(
      program.formOrGrade != null ? String(program.formOrGrade) : '',
    );
    setDurationYears(
      program.durationYears != null ? String(program.durationYears) : '',
    );
    setOrderIndex(
      program.orderIndex != null ? String(program.orderIndex) : '',
    );
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      name,
      slug: slug || slugify(name),
      description: description || undefined,
      providerName: showProviderField ? providerName || undefined : undefined,
      formOrGrade:
        showGradeField && formOrGrade ? Number(formOrGrade) : undefined,
      durationYears:
        showProviderField && durationYears ? Number(durationYears) : undefined,
      orderIndex: orderIndex ? Number(orderIndex) : undefined,
    };

    try {
      if (editing) {
        await updateProgram(editing.id, payload, token);
        setSuccess(`${unitLabel} updated`);
      } else {
        await createProgram({ level, ...payload }, token);
        setSuccess(`${unitLabel} created`);
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-programs-all'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive(program: Program) {
    if (!token) return;
    if (
      !confirm(
        `Archive "${program.name}"? It will be hidden from students. Subjects and lessons are kept.`,
      )
    ) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await archiveProgram(program.id, token);
      if (editing?.id === program.id) resetForm();
      setSuccess('Program archived');
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Programs"
        description="Create and manage grades, forms, and courses for each education level — e.g. add Grade 6 under Primary or a new university program."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.entries(EDUCATION_LEVEL_LABELS) as [EducationLevel, string][]).map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setLevel(value);
                resetForm();
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                level === value
                  ? 'bg-efundo-primary text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {(error || success) && (
        <div className="mt-4 space-y-2">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1"
        >
          <h2 className="font-semibold text-slate-900">
            {editing ? `Edit ${unitLabel.toLowerCase()}` : `Add ${unitLabel.toLowerCase()}`}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {EDUCATION_LEVEL_LABELS[level]} level
          </p>

          <div className="mt-4 space-y-4">
            {showGradeField && (
              <FormField
                label={
                  level === 'PRIMARY'
                    ? 'Grade number'
                    : level === 'O_LEVEL'
                      ? 'Form number'
                      : 'Form / year'
                }
              >
                <Input
                  type="number"
                  min={1}
                  max={13}
                  value={formOrGrade}
                  onChange={(e) => {
                    setFormOrGrade(e.target.value);
                    if (!editing) suggestNameFromGrade(e.target.value);
                  }}
                  placeholder={level === 'PRIMARY' ? '6' : '4'}
                  required={!editing}
                />
              </FormField>
            )}

            <FormField label="Display name">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editing && !slug) setSlug(slugify(e.target.value));
                }}
                placeholder={
                  level === 'PRIMARY'
                    ? 'Grade 6'
                    : level === 'TERTIARY'
                      ? 'BSc Computer Science'
                      : 'Form 4'
                }
                required
              />
            </FormField>

            <FormField label="Slug">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={name ? slugify(name) : 'auto-generated'}
                required
              />
            </FormField>

            {showProviderField && (
              <>
                <FormField label="Provider (school / university)">
                  <Input
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="University of Zimbabwe"
                  />
                </FormField>
                <FormField label="Duration (years)">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    placeholder="4"
                  />
                </FormField>
              </>
            )}

            <FormField label="Description (optional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </FormField>

            <FormField label="Sort order">
              <Input
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                placeholder="0"
              />
            </FormField>
          </div>

          <div className="mt-6 flex gap-3">
            <SubmitButton loading={loading}>
              {editing ? 'Update' : 'Create'}
            </SubmitButton>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="rounded-xl border bg-white shadow-sm lg:col-span-2">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {EDUCATION_LEVEL_LABELS[level]} {unitLabel.toLowerCase()}s
            </h2>
            <p className="text-sm text-slate-500">
              {programs.length} program{programs.length === 1 ? '' : 's'}
            </p>
          </div>

          {isLoading ? (
            <p className="p-8 text-center text-slate-500">Loading…</p>
          ) : programs.length === 0 ? (
            <p className="p-8 text-center text-slate-500">
              No programs yet. Add the first {unitLabel.toLowerCase()} using the form.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    {showGradeField && (
                      <th className="px-5 py-3">
                        {level === 'PRIMARY' ? 'Grade' : 'Form'}
                      </th>
                    )}
                    {showProviderField && (
                      <th className="px-5 py-3">Provider</th>
                    )}
                    <th className="px-5 py-3">Subjects</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {programs.map((program) => (
                    <tr key={program.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{program.name}</p>
                        <p className="text-xs text-slate-400">{program.slug}</p>
                      </td>
                      {showGradeField && (
                        <td className="px-5 py-3 text-slate-600">
                          {program.formOrGrade ?? '—'}
                        </td>
                      )}
                      {showProviderField && (
                        <td className="px-5 py-3 text-slate-600">
                          {program.providerName ?? '—'}
                          {program.durationYears != null && (
                            <span className="block text-xs text-slate-400">
                              {program.durationYears} years
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3 text-slate-600">
                        {program.subjects?.length ?? 0}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/subjects?program=${program.id}`)
                            }
                            className="text-xs text-slate-500 hover:text-efundo-primary"
                          >
                            Subjects
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/lessons?program=${program.id}`)
                            }
                            className="text-xs text-slate-500 hover:text-efundo-primary"
                          >
                            Lessons
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(program)}
                            className="text-xs text-efundo-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(program)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Need to manage subjects inside a program? Go to{' '}
        <Link href="/admin/subjects" className="text-efundo-primary hover:underline">
          Subjects
        </Link>{' '}
        or open a program&apos;s subjects from the table above.
      </p>
    </div>
  );
}
