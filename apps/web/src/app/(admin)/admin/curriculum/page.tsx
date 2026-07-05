'use client';

import { useState } from 'react';
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
import { api } from '@/lib/api';
import { archiveProgram, getPrograms } from '@/lib/curriculum';

export default function AdminCurriculumPage() {
  const router = useRouter();
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<EducationLevel>('TERTIARY');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['admin-programs', level],
    queryFn: () => getPrograms(level),
    enabled: !!user,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post(
        '/curriculum/programs',
        {
          level,
          name,
          slug: slug || slugify(name),
          providerName: providerName || undefined,
        },
        token,
      );
      setSuccess('Program created');
      setName('');
      setSlug('');
      setProviderName('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive(id: string, programName: string) {
    if (!token) return;
    if (
      !confirm(
        `Archive "${programName}"? It will be hidden from students. Subjects are kept but the program won't appear in browse lists.`,
      )
    ) {
      return;
    }
    try {
      await archiveProgram(id, token);
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
      setSuccess('Program archived');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    }
  }

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Curriculum"
        description="Manage education levels, programs, and subjects"
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.entries(EDUCATION_LEVEL_LABELS) as [EducationLevel, string][]).map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLevel(value)}
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
        <div className="mt-4">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? 'Cancel' : 'Add program'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 space-y-4 rounded-xl border bg-white p-6"
        >
          <FormField label="Program name">
            <Input value={name} onChange={setName} required />
          </FormField>
          <FormField label="Slug">
            <Input
              value={slug}
              onChange={setSlug}
              placeholder={name ? slugify(name) : 'auto-generated'}
            />
          </FormField>
          {(level === 'TERTIARY' || level === 'OTHER') && (
            <FormField label="Provider (school / university)">
              <Input value={providerName} onChange={setProviderName} />
            </FormField>
          )}
          <SubmitButton loading={loading}>Create program</SubmitButton>
        </form>
      )}

      {isLoading ? (
        <p className="mt-8 text-slate-500">Loading...</p>
      ) : programs.length === 0 ? (
        <p className="mt-8 text-slate-500">No programs for this level.</p>
      ) : (
        <ul className="mt-8 divide-y rounded-xl border bg-white">
          {programs.map((program: Program) => (
            <li
              key={program.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{program.name}</p>
                {program.providerName && (
                  <p className="text-sm text-slate-500">{program.providerName}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {program.subjects?.length ?? 0} subjects · {program.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/admin/curriculum/${program.id}`)}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleArchive(program.id, program.name)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
