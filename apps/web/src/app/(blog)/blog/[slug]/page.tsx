import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { BlogPostContent } from '@/components/blog/BlogCard';
import { BlogPageFrame } from '@/components/blog/BlogPageFrame';
import { BlogSignupCta } from '@/components/blog/BlogSignupCta';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
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
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = (await getAllPosts())
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);

  return (
    <BlogPageFrame narrow>
      <Link
        href="/blog"
        className="text-sm font-medium text-efundo-primary hover:underline"
      >
        ← Back to blog
      </Link>

      <div className="mt-6">
        <BlogPostContent post={post} />
      </div>

      <BlogSignupCta />

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
    </BlogPageFrame>
  );
}
