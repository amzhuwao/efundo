import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog/posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://efundo.co.zw';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/how-it-works',
    '/privacy',
    '/terms',
    '/blog',
    '/study-guides',
    '/login',
    '/register',
  ];

  const blogRoutes = getAllPosts().map((post) => `/blog/${post.slug}`);

  return [...staticRoutes, ...blogRoutes].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route.startsWith('/blog/') ? 'monthly' : route === '' || route === '/blog' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/blog/') ? 0.7 : 0.8,
  }));
}
