'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { getSubjectsForLearn } from '@/lib/curriculum';
import { listDiscussions, createDiscussion } from '@/lib/forum';

export default function ForumPage() {
  const router = useRouter();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();
  const queryClient = useQueryClient();
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');

  const { data: subjects = [] } = useQuery({
    queryKey: ['learn-subjects', user?.programId, user?.educationLevel],
    queryFn: () => getSubjectsForLearn(user?.programId, user?.educationLevel),
    enabled: hasHydrated && !!user,
  });

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['discussions', subjectFilter],
    queryFn: () => listDiscussions(subjectFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createDiscussion(
        { subjectId: newSubjectId, title, body },
        token!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      setShowForm(false);
      setTitle('');
      setBody('');
    },
  });

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (subjects.length && !newSubjectId) {
      setNewSubjectId(subjects.find((s) => s.code === 'CS301')?.id ?? subjects[0].id);
    }
  }, [subjects, newSubjectId]);

  if (!hasHydrated || !user) {
    return (
      <div className="py-12 text-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Study Forum</h1>
          <p className="mt-1 text-slate-600">
            Ask questions and help fellow students
          </p>
        </div>
        {token && subjects.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            New discussion
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="mt-6 space-y-4 rounded-xl border bg-white p-6"
        >
          <select
            value={newSubjectId}
            onChange={(e) => setNewSubjectId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discussion title"
            required
            minLength={5}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your question or topic..."
            required
            minLength={10}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white"
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {subjects.length > 0 && (
        <div className="mt-6">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <p className="mt-12 text-center text-slate-500">Loading discussions...</p>
      ) : discussions.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">
          No discussions yet. Start the conversation!
        </p>
      ) : (
        <ul className="mt-8 divide-y rounded-xl border bg-white">
          {discussions.map((d) => (
            <li key={d.id}>
              <Link
                href={`/forum/${d.id}`}
                className="block px-6 py-5 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {d.isPinned && (
                      <span className="text-xs font-medium text-amber-600">
                        Pinned ·{' '}
                      </span>
                    )}
                    <span className="text-xs font-medium text-efundo-primary">
                      {d.subject.code}
                    </span>
                    <h2 className="mt-1 font-semibold text-slate-900">
                      {d.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {d.body}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {d.author.fullName} ·{' '}
                      {new Date(d.createdAt).toLocaleDateString()} ·{' '}
                      {d._count.comments} replies · {d.viewCount} views
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
