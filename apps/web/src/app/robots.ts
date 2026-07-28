import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://efundo.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/onboarding', '/admin'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
