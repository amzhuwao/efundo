'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAdminGuard,
  AdminPageHeader,
  FormField,
  Input,
  Select,
  SubmitButton,
  ErrorAlert,
  SuccessAlert,
} from '@/components/admin/AdminForms';
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
  type Program,
  type Subject,
} from '@efundo/shared-types';
import {
  createSubject,
  deleteSubject,
  getPrograms,
  updateSubject,
} from '@/lib/curriculum';

type SubjectRow = Subject & {
  programName: string;
  programProvider?: string | null;
  level: EducationLevel;
};

export default function AdminSubjectsPage() {
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [level, setLevel] = useState<EducationLevel>('TERTIARY');
  const [programId, setProgramId] = useState('');
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['admin-programs', level],
    queryFn: () => getPrograms(level),
    enabled: !!user,
  });

  useEffect(() => {
    const programParam = searchParams.get('program');
    if (programParam && programs.some((p) => p.id === programParam)) {
      setProgramId(programParam);
      const program = programs.find((p) => p.id === programParam);
      if (program) setLevel(program.level);
    }
  }, [searchParams, programs]);

  const subjects: SubjectRow[] = programs.flatMap((program: Program) =>
    (program.subjects ?? []).map((subject) => ({
      ...subject,
      programName: program.name,
      programProvider: program.providerName,
      level: program.level,
    })),
  );

  const filtered = programId
    ? subjects.filter((s) => s.programId === programId)
    : subjects;

  function resetForm() {
    setEditing(null);
    setName('');
    setCode('');
    setYear('');
    setSemester('');
  }

  function startEdit(subject: Subject) {
    setEditing(subject);
    setProgramId(subject.programId);
    setName(subject.name);
    setCode(subject.code);
    setYear(subject.year != null ? String(subject.year) : '');
    setSemester(subject.semester != null ? String(subject.semester) : '');
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !programId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const payload = {
      name,
      code,
      year: year ? Number(year) : undefined,
      semester: semester ? Number(semester) : undefined,
    };
    try {
      if (editing) {
        await updateSubject(editing.id, payload, token);
        setSuccess('Subject updated');
      } else {
        await createSubject(programId, payload, token);
        setSuccess('Subject created');
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(subject: SubjectRow) {
    if (!token) return;
    if (
      !confirm(
        `Delete "${subject.code} — ${subject.name}"? Linked lessons and resources will be removed.`,
      )
    ) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await deleteSubject(subject.id, token);
      setSuccess('Subject deleted');
      if (editing?.id === subject.id) resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Subjects"
        description="Create and manage subjects across programs. Subjects group lessons, library resources, and forum discussions."
        backHref="/admin/curriculum"
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.entries(EDUCATION_LEVEL_LABELS) as [EducationLevel, string][]).map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setLevel(value);
                setProgramId('');
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

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1"
        >
          <h2 className="font-semibold text-slate-900">
            {editing ? 'Edit subject' : 'Add subject'}
          </h2>
          <div className="mt-4 space-y-4">
            <FormField label="Program">
              <Select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                required
              >
                <option value="">Select program…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.providerName ? ` — ${p.providerName}` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Subject name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Database Systems"
                required
              />
            </FormField>
            <FormField label="Subject code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS301"
                required
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Year">
                <Input
                  type="number"
                  min={1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="1"
                />
              </FormField>
              <FormField label="Semester">
                <Input
                  type="number"
                  min={1}
                  max={2}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="1"
                />
              </FormField>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <SubmitButton loading={loading}>
              {editing ? 'Update subject' : 'Create subject'}
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
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                {EDUCATION_LEVEL_LABELS[level]} subjects
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} subject{filtered.length === 1 ? '' : 's'}
              </p>
            </div>
            <Select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="max-w-xs"
            >
              <option value="">All programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <p className="p-8 text-center text-slate-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-slate-500">
              No subjects yet. Create one using the form.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Year</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((subject) => (
                    <tr key={subject.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {subject.code}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{subject.name}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {subject.programName}
                        {subject.programProvider && (
                          <span className="block text-xs text-slate-400">
                            {subject.programProvider}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {subject.year ?? '—'}
                        {subject.semester != null && ` / S${subject.semester}`}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <Link
                            href={`/admin/lessons?subject=${subject.id}&program=${subject.programId}`}
                            className="text-xs text-slate-500 hover:text-efundo-primary"
                          >
                            Lessons
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEdit(subject)}
                            className="text-xs text-efundo-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(subject)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
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
    </div>
  );
}
