import { api, API_URL } from './api';
import type { PaginatedResponse, ResourceSummary } from '@efundo/shared-types';

export const RESOURCE_TYPES = [
  { value: 'PAST_PAPER', label: 'Past Paper' },
  { value: 'TEXTBOOK', label: 'Textbook' },
  { value: 'LECTURE_NOTE', label: 'Lecture Notes' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'SOLUTION', label: 'Solution' },
  { value: 'RESEARCH_PAPER', label: 'Research Paper' },
  { value: 'LAB_MANUAL', label: 'Lab Manual' },
  { value: 'REVISION_GUIDE', label: 'Revision Guide' },
  { value: 'SLIDES', label: 'Slides' },
  { value: 'CASE_STUDY', label: 'Case Study' },
] as const;

export function formatResourceType(type: string) {
  return RESOURCE_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function searchResources(
  params: Record<string, string | number | undefined>,
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  return api.get<PaginatedResponse<ResourceSummary>>(
    `/library/resources?${qs.toString()}`,
  );
}

export async function getResource(id: string, token?: string | null) {
  return api.get<ResourceSummary & { isBookmarked?: boolean }>(
    `/library/resources/${id}`,
    token,
  );
}

export async function downloadResource(id: string, token: string) {
  const meta = await api.post<{
    downloadUrl: string;
    fileName: string;
  }>(`/library/resources/${id}/download`, {}, token);

  const res = await fetch(meta.downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = meta.fileName ?? 'download';
  a.click();
  URL.revokeObjectURL(url);
}

export async function toggleBookmark(id: string, token: string) {
  return api.post<{ bookmarked: boolean }>(
    `/library/resources/${id}/bookmark`,
    {},
    token,
  );
}

export async function getBookmarks(token: string) {
  return api.get<ResourceSummary[]>('/library/bookmarks', token);
}

export async function getPendingResources(token: string) {
  return api.get<ResourceSummary[]>('/library/resources/pending', token);
}

export async function moderateResource(
  id: string,
  action: 'approve' | 'reject' | 'publish',
  token: string,
  rejectionReason?: string,
) {
  return api.post<ResourceSummary>(
    `/library/resources/${id}/moderate`,
    { action, rejectionReason },
    token,
  );
}

export async function createResource(
  data: Record<string, unknown>,
  token: string,
) {
  return api.post<ResourceSummary>('/library/resources', data, token);
}

export async function uploadResourceFile(
  id: string,
  file: File,
  token: string,
) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/library/resources/${id}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? 'Upload failed');
  return body as ResourceSummary;
}

export async function submitResource(id: string, token: string) {
  return api.post<ResourceSummary>(
    `/library/resources/${id}/submit`,
    {},
    token,
  );
}
