'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  getResource,
  downloadResource,
  toggleBookmark,
  formatResourceType,
  formatFileSize,
} from '@/lib/library';

export default function ResourceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const token = accessToken();
  const [rating, setRating] = useState(5);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) window.location.href = '/login';
  }, [user]);

  const { data: resource, isLoading } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => getResource(id, token),
    enabled: !!id,
  });

  const bookmarkMut = useMutation({
    mutationFn: () => toggleBookmark(id, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resource', id] }),
  });

  async function handleDownload() {
    if (!token) return;
    setDownloading(true);
    try {
      await downloadResource(id, token);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading || !resource) {
    return (
      <div className="max-w-3xl py-12 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/library" className="text-sm text-efundo-primary hover:underline">
        ← Back to library
      </Link>

      <article className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-efundo-primary">
          {formatResourceType(resource.type)}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{resource.title}</h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          {resource.program && (
            <span>{resource.program.providerName ?? resource.program.name}</span>
          )}
          {resource.subject && (
            <span>
              · {resource.subject.name} ({resource.subject.code})
            </span>
          )}
          {resource.year && <span>· Year {resource.year}</span>}
          {resource.author && <span>· {resource.author}</span>}
        </div>

        {resource.description && (
          <p className="mt-6 leading-relaxed text-slate-600">{resource.description}</p>
        )}

        {resource.externalUrl && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Third-party course listing</p>
            <p className="mt-2 leading-relaxed">
              {resource.attributionNotice ??
                `This course is offered by ${resource.sourceName ?? 'the original provider'}. eFundo does not host course materials.`}
            </p>
            {resource.sourceCatalogUrl && (
              <p className="mt-2">
                Source catalog:{' '}
                <a
                  href={resource.sourceCatalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-efundo-primary hover:underline"
                >
                  {resource.sourceCatalogUrl}
                </a>
              </p>
            )}
          </div>
        )}

        <dl className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          {resource.externalUrl ? (
            <>
              <div>
                <dt className="text-slate-500">Provider</dt>
                <dd className="font-medium">{resource.sourceName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-medium">
                  {resource.durationWeeks ? `${resource.durationWeeks} weeks` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Views</dt>
                <dd className="font-medium">{resource.viewCount}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="text-slate-500">File</dt>
                <dd className="font-medium">{resource.fileName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Size</dt>
                <dd className="font-medium">{formatFileSize(resource.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Downloads</dt>
                <dd className="font-medium">{resource.downloadCount}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Views</dt>
                <dd className="font-medium">{resource.viewCount}</dd>
              </div>
            </>
          )}
        </dl>

        {resource.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {resource.externalUrl ? (
            <a
              href={resource.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-efundo-primary px-6 py-2.5 font-semibold text-white hover:bg-efundo-primary-dark"
            >
              View on {resource.sourceName ?? 'provider site'} →
            </a>
          ) : (
            resource.hasFile && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-xl bg-efundo-primary px-6 py-2.5 font-semibold text-white hover:bg-efundo-primary-dark disabled:opacity-50"
              >
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            )
          )}
          <button
            onClick={() => bookmarkMut.mutate()}
            disabled={bookmarkMut.isPending}
            className="rounded-xl border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            {resource.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          </button>
        </div>
      </article>
    </div>
  );
}
