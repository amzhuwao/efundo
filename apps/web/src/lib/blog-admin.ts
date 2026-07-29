import { api } from './api';
import type { BlogPost, BlogSection } from './blog/posts';

export type AdminBlogPost = BlogPost & {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt?: string;
  updatedAt?: string;
};

export type BlogPostPayload = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author?: string;
  readTimeMinutes?: number;
  publishedAt?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  sections: BlogSection[];
};

export function listAdminBlogPosts(token: string) {
  return api.get<AdminBlogPost[]>('/blog/admin/posts', token);
}

export function createBlogPost(payload: BlogPostPayload, token: string) {
  return api.post<AdminBlogPost>('/blog/admin/posts', payload, token);
}

export function updateBlogPost(
  id: string,
  payload: Partial<BlogPostPayload>,
  token: string,
) {
  return api.patch<AdminBlogPost>(`/blog/admin/posts/${id}`, payload, token);
}

export function deleteBlogPost(id: string, token: string) {
  return api.delete<{ message: string }>(`/blog/admin/posts/${id}`, token);
}
