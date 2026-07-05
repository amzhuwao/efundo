import { api } from './api';

export interface DiscussionSummary {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  author: { id: string; fullName: string };
  subject: { id: string; name: string; code: string };
  _count: { comments: number };
}

export interface Comment {
  id: string;
  body: string;
  isAccepted: boolean;
  upvotes: number;
  createdAt: string;
  author: { id: string; fullName: string };
}

export interface DiscussionDetail extends Omit<DiscussionSummary, '_count'> {
  comments: Comment[];
}

export function listDiscussions(subjectId?: string) {
  const qs = subjectId ? `?subjectId=${subjectId}` : '';
  return api.get<DiscussionSummary[]>(`/forum/discussions${qs}`);
}

export function getDiscussion(id: string) {
  return api.get<DiscussionDetail>(`/forum/discussions/${id}`);
}

export function createDiscussion(
  data: { subjectId: string; title: string; body: string },
  token: string,
) {
  return api.post<DiscussionSummary>('/forum/discussions', data, token);
}

export function addComment(discussionId: string, body: string, token: string) {
  return api.post<Comment>(
    `/forum/discussions/${discussionId}/comments`,
    { body },
    token,
  );
}

export function upvoteComment(commentId: string, token: string) {
  return api.post(`/forum/comments/${commentId}/upvote`, {}, token);
}

export function acceptComment(commentId: string, token: string) {
  return api.post(`/forum/comments/${commentId}/accept`, {}, token);
}
