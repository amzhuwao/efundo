import { api, API_URL } from './api';

export type AiProjectStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'READY'
  | 'APPLIED'
  | 'FAILED';

export type AiSourceStatus = 'PENDING' | 'EXTRACTING' | 'READY' | 'FAILED';
export type AiSourceType = 'PDF' | 'VIDEO' | 'TEXT';

export interface AiSource {
  id: string;
  title: string;
  type: AiSourceType;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  status: AiSourceStatus;
  errorMessage?: string | null;
  orderIndex: number;
}

export interface GeneratedLessonBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code';
  text?: string;
  items?: string[];
  language?: string;
}

export interface GeneratedLesson {
  title: string;
  slug: string;
  summary: string;
  durationMinutes: number;
  difficulty: string;
  objectives: string[];
  prerequisites: string[];
  content: GeneratedLessonBlock[];
  sourceTitles?: string[];
}

export interface GeneratedTopic {
  title: string;
  slug: string;
  description?: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedModule {
  title: string;
  slug: string;
  description?: string;
  topics: GeneratedTopic[];
}

export interface GeneratedCourseOutline {
  overview?: string;
  modules: GeneratedModule[];
}

export interface LessonAiProject {
  id: string;
  title: string;
  instructions?: string | null;
  status: AiProjectStatus;
  generatedOutline?: GeneratedCourseOutline | null;
  errorMessage?: string | null;
  appliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
    program: { id: string; name: string; providerName?: string | null };
  };
  author: { id: string; fullName: string };
  sources: AiSource[];
}

export function createAiProject(
  data: { subjectId: string; title: string; instructions?: string },
  token: string,
) {
  return api.post<LessonAiProject>('/lesson-ai/projects', data, token);
}

export function listAiProjects(subjectId: string | undefined, token: string) {
  const q = subjectId ? `?subjectId=${subjectId}` : '';
  return api.get<LessonAiProject[]>(`/lesson-ai/projects${q}`, token);
}

export function getAiProject(id: string, token: string) {
  return api.get<LessonAiProject>(`/lesson-ai/projects/${id}`, token);
}

export function updateAiProject(
  id: string,
  data: { title?: string; instructions?: string },
  token: string,
) {
  return api.patch<LessonAiProject>(`/lesson-ai/projects/${id}`, data, token);
}

export function deleteAiProject(id: string, token: string) {
  return api.delete<{ ok: boolean }>(`/lesson-ai/projects/${id}`, token);
}

export async function uploadAiSource(
  projectId: string,
  file: File,
  token: string,
) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/lesson-ai/projects/${projectId}/sources`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.message)
          ? body.message.join(', ')
          : 'Upload failed',
    );
  }
  return body as AiSource;
}

export function removeAiSource(projectId: string, sourceId: string, token: string) {
  return api.delete<{ ok: boolean }>(
    `/lesson-ai/projects/${projectId}/sources/${sourceId}`,
    token,
  );
}

export function generateAiOutline(projectId: string, token: string) {
  return api.post<{ status: AiProjectStatus }>(
    `/lesson-ai/projects/${projectId}/generate`,
    {},
    token,
  );
}

export function applyAiOutline(projectId: string, token: string) {
  return api.post<{
    ok: boolean;
    subjectId: string;
    created: { modules: number; topics: number; lessons: number };
  }>(`/lesson-ai/projects/${projectId}/apply`, {}, token);
}

export function formatAiStatus(status: AiProjectStatus) {
  const labels: Record<AiProjectStatus, string> = {
    DRAFT: 'Draft',
    PROCESSING: 'Generating…',
    READY: 'Ready to apply',
    APPLIED: 'Applied to course',
    FAILED: 'Failed',
  };
  return labels[status];
}

export function formatSourceType(type: AiSourceType) {
  return type === 'PDF' ? 'PDF' : type === 'VIDEO' ? 'Video' : 'Text';
}
