import { api } from './api';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'FILL_BLANK'
  | 'ESSAY';
export type QuizType = 'PRACTICE' | 'MOCK_EXAM';

export interface McqOption {
  id: string;
  text: string;
}

export interface QuizSummary {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: QuizType;
  timeLimitMinutes?: number | null;
  questionCount: number;
  passingScore: number;
  subject: { id: string; name: string; code: string };
  _count: { questions: number; attempts: number };
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  stem: string;
  options?: McqOption[] | null;
  difficulty: string;
  tags: string[];
}

export interface QuizAttemptStart {
  attemptId: string;
  quiz: {
    id: string;
    title: string;
    type: QuizType;
    timeLimitMinutes?: number | null;
    allowBacktrack: boolean;
    passingScore: number;
  };
  expiresAt?: string | null;
  questions: QuizQuestion[];
}

export interface GradedAnswer {
  questionId: string;
  answer: string | boolean;
  isCorrect: boolean | null;
  pendingReview?: boolean;
  explanation?: string | null;
  correctAnswer?: unknown;
  rubric?: string;
}

export interface QuizAttemptResult {
  id: string;
  score: number | null;
  correctCount: number | null;
  totalCount: number;
  status: string;
  answers: GradedAnswer[];
  submittedAt?: string | null;
  passed: boolean;
  hasPendingEssays?: boolean;
  certificate?: { id: string; code: string; issuedAt: string } | null;
  quiz: {
    id: string;
    title: string;
    type: QuizType;
    passingScore: number;
    subject: { id: string; code: string; name: string };
  };
}

export interface PerformanceStats {
  totalAttempts: number;
  avgScore: number;
  passed: number;
  certificates: number;
  subjectStats: Array<{
    subjectCode: string;
    subjectName: string;
    attempts: number;
    avgScore: number;
  }>;
  weakAreas: Array<{
    subjectCode: string;
    subjectName: string;
    attempts: number;
    avgScore: number;
  }>;
}

export function listQuizzes(subjectId?: string, token?: string | null) {
  const qs = subjectId ? `?subjectId=${subjectId}` : '';
  return api.get<QuizSummary[]>(`/assessment/quizzes${qs}`, token);
}

export function startQuiz(quizId: string, token: string) {
  return api.post<QuizAttemptStart>(`/assessment/quizzes/${quizId}/start`, {}, token);
}

export function submitAttempt(
  attemptId: string,
  answers: Array<{ questionId: string; answer: string | boolean }>,
  token: string,
) {
  return api.post<QuizAttemptResult>(
    `/assessment/attempts/${attemptId}/submit`,
    { answers },
    token,
  );
}

export function getAttempt(attemptId: string, token: string) {
  return api.get<QuizAttemptResult>(`/assessment/attempts/${attemptId}`, token);
}

export function getMyAttempts(token: string) {
  return api.get<QuizAttemptResult[]>('/assessment/attempts/me', token);
}

export function getMyStats(token: string) {
  return api.get<PerformanceStats>('/assessment/stats/me', token);
}

export interface QuizCertificateSummary {
  id: string;
  code: string;
  score: number;
  issuedAt: string;
  quiz: {
    id: string;
    title: string;
    type: QuizType;
    subject: { id: string; code: string; name: string };
  };
  attempt: { id: string; submittedAt: string | null };
}

export interface QuizCertificateDetail extends QuizCertificateSummary {
  user: { fullName: string; email: string };
}

export function listMyCertificates(token: string) {
  return api.get<QuizCertificateSummary[]>('/assessment/certificates/me', token);
}

export function getCertificate(id: string, token: string) {
  return api.get<QuizCertificateDetail>(`/assessment/certificates/${id}`, token);
}

export function formatQuizType(type: QuizType) {
  return type === 'MOCK_EXAM' ? 'Mock exam' : 'Practice quiz';
}

export type QuestionStatus = 'DRAFT' | 'PUBLISHED';
export type QuizStatus = 'DRAFT' | 'PUBLISHED';

export interface QuestionSummary {
  id: string;
  type: QuestionType;
  stem: string;
  options?: McqOption[] | null;
  correctAnswer: unknown;
  explanation?: string | null;
  difficulty: string;
  tags: string[];
  status: QuestionStatus;
  subject: { id: string; name: string; code: string };
  topic?: { id: string; title: string } | null;
}

export interface QuizManageSummary extends QuizSummary {
  status: QuizStatus;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBacktrack: boolean;
}

// ── Authoring API ───────────────────────────────────────────────────────────

export function formatQuestionType(type: QuestionType) {
  const labels: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: 'Multiple choice',
    TRUE_FALSE: 'True / false',
    SHORT_ANSWER: 'Short answer',
    FILL_BLANK: 'Fill in the blank',
    ESSAY: 'Essay',
  };
  return labels[type];
}

export function listManageQuestions(subjectId: string | undefined, token: string) {
  const qs = subjectId ? `?subjectId=${subjectId}` : '';
  return api.get<QuestionSummary[]>(`/assessment/manage/questions${qs}`, token);
}

export function createQuestion(
  data: {
    subjectId: string;
    topicId?: string;
    type: QuestionType;
    stem: string;
    options?: McqOption[];
    correctAnswer: Record<string, unknown>;
    explanation?: string;
    difficulty?: string;
    tags?: string[];
  },
  token: string,
) {
  return api.post<QuestionSummary>('/assessment/manage/questions', data, token);
}

export function publishQuestion(id: string, token: string) {
  return api.post<QuestionSummary>(`/assessment/manage/questions/${id}/publish`, {}, token);
}

export function unpublishQuestion(id: string, token: string) {
  return api.post<QuestionSummary>(`/assessment/manage/questions/${id}/unpublish`, {}, token);
}

export function updateQuestion(
  id: string,
  data: {
    topicId?: string;
    type?: QuestionType;
    stem?: string;
    options?: McqOption[];
    correctAnswer?: Record<string, unknown>;
    explanation?: string;
    difficulty?: string;
    tags?: string[];
  },
  token: string,
) {
  return api.patch<QuestionSummary>(`/assessment/manage/questions/${id}`, data, token);
}

export function deleteQuestion(id: string, token: string) {
  return api.delete<{ ok: boolean }>(`/assessment/manage/questions/${id}`, token);
}

export function listManageQuizzes(subjectId: string | undefined, token: string) {
  const qs = subjectId ? `?subjectId=${subjectId}` : '';
  return api.get<QuizManageSummary[]>(`/assessment/manage/quizzes${qs}`, token);
}

export interface QuizDetailManage extends QuizManageSummary {
  questions: Array<{ orderIndex: number; question: QuestionSummary }>;
}

export function getManageQuiz(id: string, token: string) {
  return api.get<QuizDetailManage>(`/assessment/manage/quizzes/${id}`, token);
}

export function createQuiz(
  data: {
    subjectId: string;
    title: string;
    slug: string;
    description?: string;
    type?: QuizType;
    timeLimitMinutes?: number;
    questionCount?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    allowBacktrack?: boolean;
    passingScore?: number;
    questionIds?: string[];
  },
  token: string,
) {
  return api.post<QuizManageSummary>('/assessment/manage/quizzes', data, token);
}

export function publishQuiz(id: string, token: string) {
  return api.post<QuizManageSummary>(`/assessment/manage/quizzes/${id}/publish`, {}, token);
}

export function unpublishQuiz(id: string, token: string) {
  return api.post<QuizManageSummary>(`/assessment/manage/quizzes/${id}/unpublish`, {}, token);
}

export function updateQuiz(
  id: string,
  data: {
    title?: string;
    description?: string;
    timeLimitMinutes?: number;
    questionCount?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    allowBacktrack?: boolean;
    passingScore?: number;
    questionIds?: string[];
  },
  token: string,
) {
  return api.patch<QuizDetailManage>(`/assessment/manage/quizzes/${id}`, data, token);
}

export function deleteQuiz(id: string, token: string) {
  return api.delete<{ ok: boolean }>(`/assessment/manage/quizzes/${id}`, token);
}
