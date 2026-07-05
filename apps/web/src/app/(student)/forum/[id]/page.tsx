'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  getDiscussion,
  addComment,
  upvoteComment,
  acceptComment,
} from '@/lib/forum';

export default function DiscussionPage() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuthStore();
  const token = accessToken();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: discussion, isLoading } = useQuery({
    queryKey: ['discussion', id],
    queryFn: () => getDiscussion(id),
    enabled: !!id,
  });

  const replyMutation = useMutation({
    mutationFn: () => addComment(id, reply, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion', id] });
      setReply('');
    },
  });

  useEffect(() => {
    if (!user) window.location.href = '/login';
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="max-w-3xl py-12 text-center text-slate-500">
        Loading discussion...
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="max-w-3xl py-12 text-center">
        <p className="text-slate-600">Discussion not found.</p>
        <Link href="/forum" className="mt-4 inline-block text-efundo-primary">
          ← Back to forum
        </Link>
      </div>
    );
  }

  const isAuthor = user.id === discussion.author.id;

  return (
    <div className="max-w-3xl">
      <Link href="/forum" className="text-sm text-efundo-primary hover:underline">
        ← Forum
      </Link>

      <article className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <span className="text-xs font-medium text-efundo-primary">
          {discussion.subject.code} — {discussion.subject.name}
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {discussion.title}
        </h1>
        <p className="mt-4 whitespace-pre-wrap text-slate-700">
          {discussion.body}
        </p>
        <p className="mt-4 text-xs text-slate-400">
          {discussion.author.fullName} ·{' '}
          {new Date(discussion.createdAt).toLocaleString()} ·{' '}
          {discussion.viewCount} views
        </p>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {discussion.comments.length} Replies
        </h2>
        <ul className="mt-4 space-y-4">
          {discussion.comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-xl border p-5 ${
                comment.isAccepted
                  ? 'border-green-300 bg-green-50'
                  : 'bg-white'
              }`}
            >
              {comment.isAccepted && (
                <span className="text-xs font-medium text-green-700">
                  ✓ Accepted answer
                </span>
              )}
              <p className="mt-2 whitespace-pre-wrap text-slate-700">
                {comment.body}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span>{comment.author.fullName}</span>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                {token && (
                  <button
                    onClick={() =>
                      upvoteComment(comment.id, token).then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ['discussion', id],
                        }),
                      )
                    }
                    className="text-efundo-primary hover:underline"
                  >
                    ▲ {comment.upvotes}
                  </button>
                )}
                {token && isAuthor && !comment.isAccepted && (
                  <button
                    onClick={() =>
                      acceptComment(comment.id, token).then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ['discussion', id],
                        }),
                      )
                    }
                    className="text-green-700 hover:underline"
                  >
                    Accept answer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {token && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            replyMutation.mutate();
          }}
          className="mt-8 rounded-xl border bg-white p-5"
        >
          <label className="text-sm font-medium text-slate-700">
            Your reply
          </label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
            rows={4}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Share your thoughts or answer..."
          />
          <button
            type="submit"
            disabled={replyMutation.isPending || !reply.trim()}
            className="mt-3 rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white"
          >
            Post reply
          </button>
        </form>
      )}
    </div>
  );
}
