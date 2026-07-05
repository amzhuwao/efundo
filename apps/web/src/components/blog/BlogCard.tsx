import Link from 'next/link';
import type { BlogPost } from './posts';

const categoryColors: Record<string, string> = {
  'Study Guide': 'bg-blue-100 text-blue-800',
  'Exam Tips': 'bg-amber-100 text-amber-800',
  'University Life': 'bg-green-100 text-green-800',
  'Resource Guide': 'bg-purple-100 text-purple-800',
};

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-efundo-primary/30 hover:shadow-md">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[post.category] ?? 'bg-slate-100 text-slate-700'}`}
        >
          {post.category}
        </span>
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString('en-ZW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{post.readTimeMinutes} min read</span>
      </div>
      <h2 className="mt-3 text-xl font-semibold text-slate-900">
        <Link href={`/blog/${post.slug}`} className="hover:text-efundo-primary">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-4 inline-block text-sm font-medium text-efundo-primary hover:underline"
      >
        Read article →
      </Link>
    </article>
  );
}

export function BlogPostContent({ post }: { post: BlogPost }) {
  return (
    <article>
      <header>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${categoryColors[post.category] ?? 'bg-slate-100'}`}
        >
          {post.category}
        </span>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">{post.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <span>By {post.author}</span>
          <span>·</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-ZW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span>·</span>
          <span>{post.readTimeMinutes} min read</span>
        </div>
      </header>

      <div className="prose prose-slate mt-10 max-w-none">
        {post.sections.map((section, i) => (
          <section key={i} className="mb-8">
            {section.heading && (
              <h2 className="mb-3 text-2xl font-semibold text-slate-900">
                {section.heading}
              </h2>
            )}
            {section.paragraphs?.map((p, j) => (
              <p key={j} className="mb-4 leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-600">
                {section.list.map((item, k) => (
                  <li key={k} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
