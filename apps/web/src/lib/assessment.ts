import { api } from './api';

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'FILL_BLANK';
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
  isCorrect: boolean;
  explanation?: string | null;
  correctAnswer?: unknown;
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

export function formatQuizType(type: QuizType) {
  return type === 'MOCK_EXAM' ? 'Mock exam' : 'Practice quiz';
}
