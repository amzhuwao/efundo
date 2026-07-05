'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import {
  createResource,
  uploadResourceFile,
  submitResource,
  RESOURCE_TYPES,
} from '@/lib/library';
import { getPrograms } from '@/lib/curriculum';
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
} from '@efundo/shared-types';

export default function UploadPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const token = accessToken();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PAST_PAPER');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('TERTIARY');
  const [programId, setProgramId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (
      !['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER', 'MODERATOR'].includes(
        user.role,
      )
    ) {
      router.replace('/library');
    }
  }, [user, router]);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', educationLevel],
    queryFn: () => getPrograms(educationLevel),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !file) return;
    setLoading(true);
    setError('');
    try {
      const resource = await createResource(
        {
          title,
          description,
          type,
          educationLevel,
          programId: programId || undefined,
          year,
          author: author || undefined,
        },
        token,
      );
      await uploadResourceFile(resource.id, file, token);
      await submitResource(resource.id, token);
      router.push('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Upload resource</h1>
      <p className="mt-2 text-slate-600">
        Files are reviewed before being published to the library.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border bg-white p-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Education level</label>
            <select
              value={educationLevel}
              onChange={(e) => {
                setEducationLevel(e.target.value as EducationLevel);
                setProgramId('');
              }}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Program</label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.providerName ? `${p.name} — ${p.providerName}` : p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">File (PDF, DOC, etc. max 50MB)</label>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-efundo-primary py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload & submit for review'}
        </button>
      </form>
    </div>
  );
}
