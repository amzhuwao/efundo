import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog/posts';
import { BlogCard } from '@/components/blog/BlogCard';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Study tips, exam preparation guides, and university advice for Zimbabwean students from the eFundo team.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-900">Blog</h1>
        <p className="mt-4 text-lg text-slate-600">
          Study guides, exam tips, and practical advice to help you succeed at
          university and college in Zimbabwe.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
