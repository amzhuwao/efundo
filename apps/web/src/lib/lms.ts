import { api, API_URL } from './api';

export interface LessonProgress {
  percentComplete: number;
  lastPosition: number;
  completed: boolean;
  completedAt?: string | null;
}

export interface LessonSummary {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  difficulty: string;
  status?: string;
  videoUrl?: string | null;
  videoKey?: string | null;
  progress?: LessonProgress | null;
}

export interface TopicWithLessons {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  lessons: LessonSummary[];
}

export interface ModuleWithTopics {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  topics: TopicWithLessons[];
}

export type LessonBlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'code'
  | 'video';

export interface LessonBlock {
  type: LessonBlockType;
  text?: string;
  items?: string[];
  language?: string;
  videoUrl?: string;
  caption?: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: LessonBlock[];
  videoUrl?: string | null;
  videoKey?: string | null;
  videoFileName?: string | null;
  videoMimeType?: string | null;
  videoSize?: number | null;
  durationMinutes: number;
  difficulty: string;
  status: string;
  objectives: string[];
  prerequisites: string[];
  topic: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      subject: { id: string; name: string; code: string };
    };
  };
  author?: { id: string; fullName: string } | null;
  progress?: LessonProgress | null;
}

export interface ProgressSummary {
  completed: number;
  inProgress: number;
  totalPublished: number;
  recent: Array<{
    percentComplete: number;
    completed: boolean;
    lesson: { id: string; title: string; topic: { title: string } };
  }>;
}

export interface CatalogSubject {
  id: string;
  code: string;
  name: string;
  year: number;
  semester?: number | null;
  lessonCount: number;
}

export interface CatalogProgram {
  id: string;
  name: string;
  slug: string;
  providerName?: string | null;
  formOrGrade?: number | null;
  subjects: CatalogSubject[];
}

export interface CatalogEntry {
  level: string;
  programs: CatalogProgram[];
}

export function lessonVideoUrl(lessonId: string) {
  return `${API_URL}/lms/lessons/${lessonId}/video`;
}

export function getCatalog() {
  return api.get<CatalogEntry[]>('/lms/catalog');
}

export function getModules(subjectId: string, token?: string | null) {
  return api.get<ModuleWithTopics[]>(
    `/lms/subjects/${subjectId}/modules`,
    token,
  );
}

export function getModulesForManage(subjectId: string, token: string) {
  return api.get<ModuleWithTopics[]>(
    `/lms/subjects/${subjectId}/modules/manage`,
    token,
  );
}

export function getLesson(id: string, token?: string | null) {
  return api.get<LessonDetail>(`/lms/lessons/${id}`, token);
}

export function getLessonForManage(id: string, token: string) {
  return api.get<LessonDetail>(`/lms/lessons/${id}/manage`, token);
}

export function updateLessonProgress(
  id: string,
  data: { percentComplete: number; lastPosition?: number; completed?: boolean },
  token: string,
) {
  return api.patch(`/lms/lessons/${id}/progress`, data, token);
}

export function getProgressSummary(token: string) {
  return api.get<ProgressSummary>('/lms/progress', token);
}

export function createModule(
  subjectId: string,
  data: { title: string; slug: string; description?: string; orderIndex?: number },
  token: string,
) {
  return api.post(`/lms/subjects/${subjectId}/modules`, data, token);
}

export function updateModule(
  id: string,
  data: Partial<{ title: string; slug: string; description: string; orderIndex: number }>,
  token: string,
) {
  return api.patch(`/lms/modules/${id}`, data, token);
}

export function deleteModule(id: string, token: string) {
  return api.delete(`/lms/modules/${id}`, token);
}

export function createTopic(
  moduleId: string,
  data: { title: string; slug: string; description?: string; orderIndex?: number },
  token: string,
) {
  return api.post(`/lms/modules/${moduleId}/topics`, data, token);
}

export function updateTopic(
  id: string,
  data: Partial<{ title: string; slug: string; description: string; orderIndex: number }>,
  token: string,
) {
  return api.patch(`/lms/topics/${id}`, data, token);
}

export function deleteTopic(id: string, token: string) {
  return api.delete(`/lms/topics/${id}`, token);
}

export function createLesson(
  topicId: string,
  data: {
    title: string;
    slug: string;
    summary?: string;
    content?: LessonBlock[];
    videoUrl?: string;
    durationMinutes?: number;
    difficulty?: string;
    objectives?: string[];
    prerequisites?: string[];
    orderIndex?: number;
  },
  token: string,
) {
  return api.post<{ id: string }>(`/lms/topics/${topicId}/lessons`, data, token);
}

export function updateLesson(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    summary: string;
    content: LessonBlock[];
    videoUrl: string;
    durationMinutes: number;
    difficulty: string;
    objectives: string[];
    prerequisites: string[];
    orderIndex: number;
  }>,
  token: string,
) {
  return api.patch<LessonDetail>(`/lms/lessons/${id}`, data, token);
}

export function deleteLesson(id: string, token: string) {
  return api.delete(`/lms/lessons/${id}`, token);
}

export function publishLesson(id: string, action: 'publish' | 'draft', token: string) {
  return api.post(`/lms/lessons/${id}/publish`, { action }, token);
}

export async function uploadLessonVideo(
  lessonId: string,
  file: File,
  token: string,
) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/lms/lessons/${lessonId}/video`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : 'Upload failed';
    throw new Error(message);
  }
  return data as LessonDetail;
}

export function formatDifficulty(d: string) {
  return d.charAt(0) + d.slice(1).toLowerCase();
}

export function hasVideo(lesson: {
  videoUrl?: string | null;
  videoKey?: string | null;
  content?: LessonBlock[];
}) {
  if (lesson.videoUrl || lesson.videoKey) return true;
  return lesson.content?.some((b) => b.type === 'video' && b.videoUrl) ?? false;
}

export function embedVideoUrl(url: string) {
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}
