import type {
  BlogCategory,
  BlogPost,
  BlogSection,
} from './posts';
import {
  getAllPosts as getStaticPosts,
  getPostBySlug as getStaticPostBySlug,
  getStudyGuides as getStaticStudyGuides,
  getPostsByCategory as getStaticPostsByCategory,
} from './posts';

export type { BlogCategory, BlogPost, BlogSection };

const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:3001/api/v1';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizePost(raw: BlogPost): BlogPost {
  return {
    ...raw,
    publishedAt: String(raw.publishedAt).slice(0, 10),
    sections: (raw.sections ?? []) as BlogSection[],
  };
}

/** Prefer API (DB) posts; fall back to static content if API is unavailable. */
export async function getAllPosts(): Promise<BlogPost[]> {
  const fromApi = await fetchJson<BlogPost[]>('/blog');
  if (fromApi && Array.isArray(fromApi) && fromApi.length > 0) {
    return fromApi.map(normalizePost);
  }
  return getStaticPosts();
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const fromApi = await fetchJson<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
  if (fromApi && fromApi.slug) return normalizePost(fromApi);
  return getStaticPostBySlug(slug);
}

export async function getStudyGuides(): Promise<BlogPost[]> {
  const fromApi = await fetchJson<BlogPost[]>('/blog?category=Study%20Guide');
  if (fromApi && Array.isArray(fromApi) && fromApi.length > 0) {
    return fromApi.map(normalizePost);
  }
  return getStaticStudyGuides();
}

export async function getPostsByCategory(
  category: BlogCategory,
): Promise<BlogPost[]> {
  const fromApi = await fetchJson<BlogPost[]>(
    `/blog?category=${encodeURIComponent(category)}`,
  );
  if (fromApi && Array.isArray(fromApi) && fromApi.length > 0) {
    return fromApi.map(normalizePost);
  }
  return getStaticPostsByCategory(category);
}
