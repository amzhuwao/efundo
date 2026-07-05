'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getBookmarks, formatResourceType, formatFileSize } from '@/lib/library';

export default function BookmarksPage() {
  const { user, accessToken } = useAuthStore();
  const token = accessToken();

  useEffect(() => {
    if (!user) window.location.href = '/login';
  }, [user]);

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => getBookmarks(token!),
    enabled: !!token,
  });

  return (
    <div>
      <Link href="/library" className="text-sm text-efundo-primary hover:underline">
        ← Back to library
      </Link>
      <h1 className="mt-4 text-3xl font-bold">My bookmarks</h1>

      {isLoading ? (
        <p className="mt-8 text-slate-500">Loading...</p>
      ) : bookmarks.length === 0 ? (
        <p className="mt-8 text-slate-500">
          No bookmarks yet.{' '}
          <Link href="/library" className="text-efundo-primary underline">
            Browse the library
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {bookmarks.map((r) => (
            <Link
              key={r.id}
              href={`/library/${r.id}`}
              className="rounded-xl border bg-white p-5 hover:border-efundo-primary/40"
            >
              <span className="text-xs font-medium text-efundo-primary">
                {formatResourceType(r.type)}
              </span>
              <h2 className="mt-1 font-semibold">{r.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {r.program?.providerName ?? r.program?.name} · {formatFileSize(r.fileSize)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
