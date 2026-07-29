'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  slugify,
} from '@/components/admin/AdminForms';
import {
  createBlogPost,
  deleteBlogPost,
  listAdminBlogPosts,
  updateBlogPost,
  type AdminBlogPost,
} from '@/lib/blog-admin';
import type { BlogSection } from '@/lib/blog/posts';

const CATEGORIES = [
  'Study Guide',
  'Exam Tips',
  'University Life',
  'Resource Guide',
] as const;

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Study Guide',
  author: 'eFundo Team',
  readTimeMinutes: '5',
  publishedAt: new Date().toISOString().slice(0, 10),
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  sectionsText: JSON.stringify(
    [{ heading: 'Introduction', paragraphs: ['Start writing here.'] }],
    null,
    2,
  ),
};

export default function AdminBlogPage() {
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<AdminBlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: () => listAdminBlogPosts(token!),
    enabled: !!user && !!token,
  });

  useEffect(() => {
    if (!['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'MODERATOR'].includes(user?.role ?? '')) {
      return;
    }
  }, [user]);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(post: AdminBlogPost) {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      readTimeMinutes: String(post.readTimeMinutes),
      publishedAt: String(post.publishedAt).slice(0, 10),
      status: post.status,
      sectionsText: JSON.stringify(post.sections ?? [], null, 2),
    });
    setError('');
    setSuccess('');
  }

  function parseSections(): BlogSection[] {
    const parsed = JSON.parse(form.sectionsText) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Sections must be a JSON array');
    }
    return parsed as BlogSection[];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const sections = parseSections();
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        excerpt: form.excerpt.trim(),
        category: form.category,
        author: form.author.trim() || 'eFundo Team',
        readTimeMinutes: Number(form.readTimeMinutes) || 5,
        publishedAt: form.publishedAt,
        status: form.status,
        sections,
      };
      if (editing) {
        await updateBlogPost(editing.id, payload, token);
        setSuccess('Post updated');
      } else {
        await createBlogPost(payload, token);
        setSuccess('Post created');
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(post: AdminBlogPost) {
    if (!token) return;
    if (!confirm(`Delete "${post.title}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteBlogPost(post.id, token);
      setSuccess('Post deleted');
      if (editing?.id === post.id) resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Create and publish study guides, exam tips, and articles for the public blog."
        backHref="/admin"
      />

      {(error || success) && (
        <div className="mb-4 space-y-2">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">
              {editing ? 'Edit post' : 'New post'}
            </h2>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-efundo-primary hover:underline"
              >
                New post
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <FormField label="Title">
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: editing ? f.slug : slugify(title),
                  }));
                }}
                required
              />
            </FormField>
            <FormField label="Slug">
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Excerpt">
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                required
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary"
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Category">
                <Select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Status">
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as 'DRAFT' | 'PUBLISHED',
                    }))
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </Select>
              </FormField>
              <FormField label="Author">
                <Input
                  value={form.author}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, author: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Read time (minutes)">
                <Input
                  type="number"
                  min={1}
                  value={form.readTimeMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, readTimeMinutes: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Published date">
                <Input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publishedAt: e.target.value }))
                  }
                />
              </FormField>
            </div>
            <FormField label="Sections (JSON)">
              <textarea
                value={form.sectionsText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sectionsText: e.target.value }))
                }
                required
                rows={12}
                spellCheck={false}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary"
              />
              <p className="mt-1 text-xs text-slate-500">
                Array of objects with optional heading, paragraphs[], and list[].
              </p>
            </FormField>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <SubmitButton loading={loading}>
              {editing ? 'Save changes' : 'Create post'}
            </SubmitButton>
            {editing && (
              <Link
                href={`/blog/${editing.slug}`}
                target="_blank"
                className="rounded-lg border px-4 py-2 text-sm text-slate-600"
              >
                View public
              </Link>
            )}
          </div>
        </form>

        <div className="lg:col-span-3">
          {isLoading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className={`border-b last:border-0 ${
                        editing?.id === post.id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{post.title}</p>
                        <p className="text-xs text-slate-400">/{post.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{post.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            post.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {String(post.publishedAt).slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="mr-2 text-xs font-medium text-efundo-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No posts yet — create your first article.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="border-t px-4 py-3 text-xs text-slate-400">
                {posts.length} posts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
