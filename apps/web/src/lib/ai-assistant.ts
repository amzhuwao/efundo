import { api, authFetch } from './api';

export type AiChatRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type AiSourceStatus = 'PENDING' | 'EXTRACTING' | 'READY' | 'FAILED';

export interface AiAssistantMessage {
  id: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
}

export interface AiAssistantFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: AiSourceStatus;
  errorMessage?: string | null;
  createdAt: string;
}

export interface AiAssistantSession {
  id: string;
  title: string;
  subjectId?: string | null;
  lessonId?: string | null;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; code: string } | null;
  lesson?: {
    id: string;
    title: string;
    summary?: string | null;
    objectives?: string[];
    content?: unknown;
    topic?: { title: string; module: { title: string } };
  } | null;
  messages: AiAssistantMessage[];
  files: AiAssistantFile[];
}

export interface AiAssistantSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  subject?: { id: string; name: string; code: string } | null;
  lesson?: { id: string; title: string } | null;
  messages: { content: string; role: AiChatRole; createdAt: string }[];
  _count: { messages: number; files: number };
}

export function createAssistantSession(
  data: { subjectId?: string; lessonId?: string; title?: string },
  token: string,
) {
  return api.post<AiAssistantSession>('/ai-assistant/sessions', data, token);
}

export function listAssistantSessions(token: string) {
  return api.get<AiAssistantSessionSummary[]>('/ai-assistant/sessions', token);
}

export function getAssistantSession(id: string, token: string) {
  return api.get<AiAssistantSession>(`/ai-assistant/sessions/${id}`, token);
}

export function deleteAssistantSession(id: string, token: string) {
  return api.delete<{ ok: boolean }>(`/ai-assistant/sessions/${id}`, token);
}

export function sendAssistantMessage(
  sessionId: string,
  content: string,
  token: string,
) {
  return api.post<{
    userMessage: AiAssistantMessage;
    assistantMessage: AiAssistantMessage;
  }>(`/ai-assistant/sessions/${sessionId}/messages`, { content }, token);
}

export async function uploadAssistantFile(
  sessionId: string,
  file: File,
  token: string,
) {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(`/ai-assistant/sessions/${sessionId}/files`, {
    method: 'POST',
    body: form,
  }, token);
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
  return body as AiAssistantFile;
}

export function removeAssistantFile(
  sessionId: string,
  fileId: string,
  token: string,
) {
  return api.delete<{ ok: boolean }>(
    `/ai-assistant/sessions/${sessionId}/files/${fileId}`,
    token,
  );
}
