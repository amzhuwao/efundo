'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  searchResources,
  formatResourceType,
  formatFileSize,
  RESOURCE_TYPES,
} from '@/lib/library';
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
} from '@efundo/shared-types';
import { getPrograms } from '@/lib/curriculum';

export default function LibraryPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [programId, setProgramId] = useState('');
  const [year, setYear] = useState('');

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', educationLevel],
    queryFn: () => getPrograms(educationLevel as EducationLevel),
    enabled: !!educationLevel,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['library', q, type, educationLevel, programId, year],
    queryFn: () =>
      searchResources({
        q: q || undefined,
        type: type || undefined,
        educationLevel: educationLevel || undefined,
        programId: programId || undefined,
        year: year ? Number(year) : undefined,
        limit: 24,
      }),
  });

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Digital Library</h1>
          <p className="mt-1 text-slate-600">
            Past papers, notes, textbooks, and more
          </p>
        </div>
        <Link
          href="/library/bookmarks"
          className="text-sm font-medium text-efundo-primary hover:underline"
        >
          My bookmarks →
        </Link>
      </div>

      <div className="mt-8 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
        <input
          type="search"
          placeholder="Search title, author, tags..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={educationLevel}
          onChange={(e) => {
            setEducationLevel(e.target.value);
            setProgramId('');
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          disabled={!educationLevel}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.providerName ? `${p.name} — ${p.providerName}` : p.name}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-start-4"
        >
          <option value="">All years</option>
          {[2026, 2025, 2024, 2023, 2022, 2021].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="mt-12 text-center text-slate-500">Loading resources...</p>
      ) : data?.data.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">No resources found.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((resource) => (
            <Link
              key={resource.id}
              href={`/library/${resource.id}`}
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-efundo-primary/40 hover:shadow-md"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-efundo-primary">
                {formatResourceType(resource.type)}
              </span>
              <h2 className="mt-2 font-semibold text-slate-900 line-clamp-2">
                {resource.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                {resource.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                {resource.program && (
                  <span>
                    {resource.program.providerName ?? resource.program.name}
                  </span>
                )}
                {resource.year && <span>· Year {resource.year}</span>}
                {resource.fileSize && (
                  <span>· {formatFileSize(resource.fileSize)}</span>
                )}
                <span>· {resource.downloadCount} downloads</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <p className="mt-8 text-center text-sm text-slate-500">
          Showing {data.data.length} of {data.total} resources
        </p>
      )}
    </div>
  );
}
