import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts';
import { BlogPostContent } from '@/components/blog/BlogCard';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Article not found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getAllPosts()
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/blog"
        className="text-sm font-medium text-efundo-primary hover:underline"
      >
        ← Back to blog
      </Link>

      <div className="mt-6">
        <BlogPostContent post={post} />
      </div>

      <div className="mt-12 rounded-2xl bg-blue-50 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Put these tips into practice
        </h2>
        <p className="mt-2 text-slate-600">
          Access past papers, notes, and practice tests on eFundo.
        </p>
        <Link
          href="/register"
          className="mt-4 inline-block rounded-xl bg-efundo-primary px-6 py-2.5 font-semibold text-white hover:bg-efundo-primary-dark"
        >
          Create free account
        </Link>
      </div>

      {related.length > 0 && (
        <aside className="mt-16 border-t pt-12">
          <h2 className="text-lg font-semibold text-slate-900">Related articles</h2>
          <ul className="mt-4 space-y-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="text-efundo-primary hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
