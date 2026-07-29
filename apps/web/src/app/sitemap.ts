import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://efundo.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/how-it-works',
    '/privacy',
    '/terms',
    '/account-deletion',
    '/blog',
    '/study-guides',
    '/login',
    '/register',
  ];

  const posts = await getAllPosts();
  const blogRoutes = posts.map((post) => `/blog/${post.slug}`);

  return [...staticRoutes, ...blogRoutes].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith('/blog/')
      ? 'monthly'
      : route === '' || route === '/blog'
        ? 'weekly'
        : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/blog/') ? 0.7 : 0.8,
  }));
}
