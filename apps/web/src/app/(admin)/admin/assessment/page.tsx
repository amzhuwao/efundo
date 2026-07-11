'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  useAuthorGuard,
  AdminPageHeader,
  FormField,
  Input,
  SubmitButton,
  ErrorAlert,
  slugify,
} from '@/components/admin/AdminForms';
import { getCatalog, getModulesForManage } from '@/lib/lms';
import {
  listManageQuestions,
  listManageQuizzes,
  createQuestion,
  updateQuestion,
  createQuiz,
  updateQuiz,
  getManageQuiz,
  publishQuestion,
  unpublishQuestion,
  publishQuiz,
  unpublishQuiz,
  deleteQuestion,
  deleteQuiz,
  formatQuestionType,
  formatQuizType,
  type QuestionType,
  type QuizType,
  type McqOption,
  type QuestionSummary,
} from '@/lib/assessment';

const QUESTION_TYPES: QuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'FILL_BLANK',
  'ESSAY',
];

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export default function AdminAssessmentPage() {
  const user = useAuthorGuard();
  const token = useAuthStore((s) => s.accessToken());
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [subjectId, setSubjectId] = useState(searchParams.get('subject') ?? '');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'questions' | 'quizzes'>('questions');

  // Question form
  const [qType, setQType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [qStem, setQStem] = useState('');
  const [qTopicId, setQTopicId] = useState('');
  const [qDifficulty, setQDifficulty] = useState<string>('BEGINNER');
  const [qExplanation, setQExplanation] = useState('');
  const [mcqOptions, setMcqOptions] = useState<McqOption[]>([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  const [mcqCorrect, setMcqCorrect] = useState('a');
  const [tfCorrect, setTfCorrect] = useState<'true' | 'false'>('true');
  const [textAnswers, setTextAnswers] = useState('');
  const [essayRubric, setEssayRubric] = useState('');
  const [essaySample, setEssaySample] = useState('');
  const [essayMaxPoints, setEssayMaxPoints] = useState('10');

  // Quiz form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizType, setQuizType] = useState<QuizType>('PRACTICE');
  const [quizTimeLimit, setQuizTimeLimit] = useState('');
  const [quizPassing, setQuizPassing] = useState('60');
  const [quizAllowBacktrack, setQuizAllowBacktrack] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  const { data: catalog = [] } = useQuery({
    queryKey: ['lms-catalog'],
    queryFn: getCatalog,
    enabled: !!user,
  });

  const subjects = catalog.flatMap((e) =>
    e.programs.flatMap((p) => p.subjects.map((s) => ({ ...s, programName: p.name }))),
  );

  const { data: modules = [] } = useQuery({
    queryKey: ['lms-manage', subjectId],
    queryFn: () => getModulesForManage(subjectId, token!),
    enabled: !!subjectId && !!token,
  });

  const topics = modules.flatMap((m) =>
    m.topics.map((t) => ({ ...t, moduleTitle: m.title })),
  );

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['manage-questions', subjectId],
    queryFn: () => listManageQuestions(subjectId || undefined, token!),
    enabled: !!token,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['manage-quizzes', subjectId],
    queryFn: () => listManageQuizzes(subjectId || undefined, token!),
    enabled: !!token,
  });

  const publishedQuestions = questions.filter((q) => q.status === 'PUBLISHED');
  const quizQuestionOptions =
    editingQuizId
      ? questions.filter(
          (q) => q.status === 'PUBLISHED' || selectedQuestionIds.includes(q.id),
        )
      : publishedQuestions;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['manage-questions', subjectId] });
    queryClient.invalidateQueries({ queryKey: ['manage-quizzes', subjectId] });
  };

  function buildCorrectAnswer(): Record<string, unknown> {
    if (qType === 'MULTIPLE_CHOICE') return { type: 'single', value: mcqCorrect };
    if (qType === 'TRUE_FALSE') return { type: 'boolean', value: tfCorrect === 'true' };
    if (qType === 'ESSAY') {
      return {
        type: 'essay',
        rubric: essayRubric || undefined,
        sampleAnswer: essaySample || undefined,
        maxPoints: essayMaxPoints ? Number(essayMaxPoints) : 10,
      };
    }
    const values = textAnswers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return { type: 'text', values, caseSensitive: false };
  }

  function resetQuestionForm() {
    setEditingQuestionId(null);
    setQType('MULTIPLE_CHOICE');
    setQStem('');
    setQTopicId('');
    setQDifficulty('BEGINNER');
    setQExplanation('');
    setMcqOptions([
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ]);
    setMcqCorrect('a');
    setTfCorrect('true');
    setTextAnswers('');
    setEssayRubric('');
    setEssaySample('');
    setEssayMaxPoints('10');
  }

  function loadQuestionForEdit(q: QuestionSummary) {
    setEditingQuestionId(q.id);
    setQType(q.type);
    setQStem(q.stem);
    setQTopicId(q.topic?.id ?? '');
    setQDifficulty(q.difficulty);
    setQExplanation(q.explanation ?? '');
    const ca = q.correctAnswer as Record<string, unknown>;
    if (q.type === 'MULTIPLE_CHOICE') {
      setMcqOptions((q.options as McqOption[]) ?? mcqOptions);
      setMcqCorrect(String(ca.value ?? 'a'));
    } else if (q.type === 'TRUE_FALSE') {
      setTfCorrect(ca.value === true ? 'true' : 'false');
    } else if (q.type === 'ESSAY') {
      setEssayRubric(String(ca.rubric ?? ''));
      setEssaySample(String(ca.sampleAnswer ?? ''));
      setEssayMaxPoints(String(ca.maxPoints ?? '10'));
    } else {
      const values = (ca.values as string[]) ?? (ca.value ? [String(ca.value)] : []);
      setTextAnswers(values.join(', '));
    }
    setTab('questions');
  }

  function resetQuizForm() {
    setEditingQuizId(null);
    setQuizTitle('');
    setQuizDesc('');
    setQuizType('PRACTICE');
    setQuizTimeLimit('');
    setQuizPassing('60');
    setQuizAllowBacktrack(true);
    setSelectedQuestionIds([]);
  }

  async function loadQuizForEdit(quizId: string) {
    const quiz = await getManageQuiz(quizId, token!);
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title);
    setQuizDesc(quiz.description ?? '');
    setQuizType(quiz.type);
    setQuizTimeLimit(quiz.timeLimitMinutes?.toString() ?? '');
    setQuizPassing(String(quiz.passingScore));
    setQuizAllowBacktrack(quiz.allowBacktrack);
    setSelectedQuestionIds(quiz.questions.map((qq) => qq.question.id));
    if (quiz.subject?.id) setSubjectId(quiz.subject.id);
    setTab('quizzes');
  }

  const saveQuestionMut = useMutation({
    mutationFn: () => {
      const payload = {
        topicId: qTopicId || undefined,
        type: qType,
        stem: qStem,
        options: qType === 'MULTIPLE_CHOICE' ? mcqOptions.filter((o) => o.text.trim()) : undefined,
        correctAnswer: buildCorrectAnswer(),
        explanation: qExplanation || undefined,
        difficulty: qDifficulty,
      };
      if (editingQuestionId) {
        return updateQuestion(editingQuestionId, payload, token!);
      }
      return createQuestion({ subjectId, ...payload }, token!);
    },
    onSuccess: () => {
      resetQuestionForm();
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const saveQuizMut = useMutation({
    mutationFn: () => {
      const payload = {
        title: quizTitle,
        description: quizDesc || undefined,
        timeLimitMinutes: quizTimeLimit ? Number(quizTimeLimit) : undefined,
        questionCount: selectedQuestionIds.length || 10,
        allowBacktrack: quizAllowBacktrack,
        passingScore: Number(quizPassing),
        questionIds: selectedQuestionIds,
      };
      if (editingQuizId) {
        return updateQuiz(editingQuizId, payload, token!);
      }
      return createQuiz(
        {
          subjectId,
          slug: slugify(quizTitle),
          type: quizType,
          ...payload,
        },
        token!,
      );
    },
    onSuccess: () => {
      resetQuizForm();
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const createQuestionMut = saveQuestionMut;
  const createQuizMut = saveQuizMut;

  useEffect(() => {
    const subject = searchParams.get('subject');
    if (subject) setSubjectId(subject);
  }, [searchParams]);

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Assessment authoring"
        description="Build question banks, practice quizzes, and timed mock exams."
        backHref="/admin"
      />

      <div className="mb-6 flex gap-2">
        <Link
          href="/practice"
          className="text-sm font-medium text-efundo-primary hover:underline"
        >
          Preview student practice page →
        </Link>
      </div>

      <ErrorAlert message={error} />

      <section className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
        <FormField label="Subject">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </FormField>
      </section>

      <div className="mb-6 flex gap-1 border-b">
        {(['questions', 'quizzes'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t
                ? 'border-efundo-primary text-efundo-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'questions' ? 'Question bank' : 'Quizzes & exams'}
          </button>
        ))}
      </div>

      {tab === 'questions' && (
        <div className="grid gap-8 lg:grid-cols-2">
          <form
            className="rounded-xl border bg-white p-5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              if (!subjectId) {
                setError('Select a subject first');
                return;
              }
              createQuestionMut.mutate();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">
                {editingQuestionId ? 'Edit question' : 'Add question'}
              </h3>
              {editingQuestionId && (
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:underline"
                  onClick={resetQuestionForm}
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="mt-4 space-y-4">
              <FormField label="Type">
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as QuestionType)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {formatQuestionType(t)}
                    </option>
                  ))}
                </select>
              </FormField>

              {topics.length > 0 && (
                <FormField label="Topic (optional)">
                  <select
                    value={qTopicId}
                    onChange={(e) => setQTopicId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">No specific topic</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.moduleTitle} → {t.title}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label="Question">
                <textarea
                  value={qStem}
                  onChange={(e) => setQStem(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Enter the question text…"
                />
              </FormField>

              {qType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Options</p>
                  {mcqOptions.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={mcqCorrect === opt.id}
                        onChange={() => setMcqCorrect(opt.id)}
                        title="Mark as correct"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const next = [...mcqOptions];
                          next[i] = { ...opt, text: e.target.value };
                          setMcqOptions(next);
                        }}
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">Select the radio button for the correct answer</p>
                </div>
              )}

              {qType === 'TRUE_FALSE' && (
                <FormField label="Correct answer">
                  <select
                    value={tfCorrect}
                    onChange={(e) => setTfCorrect(e.target.value as 'true' | 'false')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </FormField>
              )}

              {(qType === 'SHORT_ANSWER' || qType === 'FILL_BLANK') && (
                <FormField label="Accepted answers (comma-separated)">
                  <Input
                    value={textAnswers}
                    onChange={(e) => setTextAnswers(e.target.value)}
                    placeholder="e.g. 3NF, third normal form"
                    required
                  />
                </FormField>
              )}

              {qType === 'ESSAY' && (
                <>
                  <FormField label="Marking rubric">
                    <textarea
                      value={essayRubric}
                      onChange={(e) => setEssayRubric(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="What should a full-mark answer include?"
                    />
                  </FormField>
                  <FormField label="Sample answer (optional, for lecturers)">
                    <textarea
                      value={essaySample}
                      onChange={(e) => setEssaySample(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </FormField>
                  <FormField label="Max points">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={essayMaxPoints}
                      onChange={(e) => setEssayMaxPoints(e.target.value)}
                    />
                  </FormField>
                </>
              )}

              <FormField label="Difficulty">
                <select
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Explanation (shown after submit)">
                <textarea
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </FormField>
            </div>
            <div className="mt-4">
              <SubmitButton loading={createQuestionMut.isPending}>
                {editingQuestionId ? 'Save changes' : 'Save as draft'}
              </SubmitButton>
            </div>
          </form>

          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-semibold text-slate-900">Question bank</h3>
              <p className="text-sm text-slate-500">{questions.length} questions</p>
            </div>
            {questionsLoading ? (
              <p className="p-6 text-slate-500">Loading…</p>
            ) : questions.length === 0 ? (
              <p className="p-6 text-slate-500">No questions yet.</p>
            ) : (
              <ul className="divide-y">
                {questions.map((q) => (
                  <li key={q.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              q.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {q.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                          </span>
                          <span className="text-[10px] font-medium uppercase text-slate-400">
                            {formatQuestionType(q.type)}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-800">{q.stem}</p>
                        {q.topic && (
                          <p className="mt-1 text-xs text-slate-500">{q.topic.title}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 text-xs">
                        <button
                          type="button"
                          className="text-efundo-primary hover:underline"
                          onClick={() => loadQuestionForEdit(q)}
                        >
                          Edit
                        </button>
                        {q.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="text-green-600 hover:underline"
                            onClick={async () => {
                              await publishQuestion(q.id, token!);
                              invalidate();
                            }}
                          >
                            Publish
                          </button>
                        )}
                        {q.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            className="text-amber-600 hover:underline"
                            onClick={async () => {
                              await unpublishQuestion(q.id, token!);
                              invalidate();
                            }}
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          onClick={async () => {
                            if (!confirm('Delete this question?')) return;
                            await deleteQuestion(q.id, token!);
                            invalidate();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'quizzes' && (
        <div className="grid gap-8 lg:grid-cols-2">
          <form
            className="rounded-xl border bg-white p-5 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              if (!subjectId) {
                setError('Select a subject first');
                return;
              }
              if (selectedQuestionIds.length === 0) {
                setError('Select at least one published question');
                return;
              }
              createQuizMut.mutate();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">
                {editingQuizId ? 'Edit quiz' : 'Create quiz'}
              </h3>
              {editingQuizId && (
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:underline"
                  onClick={resetQuizForm}
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="mt-4 space-y-4">
              <FormField label="Title">
                <Input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required
                  placeholder="e.g. Week 3 Practice Quiz"
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={quizDesc}
                  onChange={(e) => setQuizDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </FormField>
              <FormField label="Type">
                <select
                  value={quizType}
                  onChange={(e) => {
                    const t = e.target.value as QuizType;
                    setQuizType(t);
                    if (t === 'MOCK_EXAM') setQuizAllowBacktrack(false);
                  }}
                  disabled={!!editingQuizId}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                >
                  <option value="PRACTICE">Practice quiz</option>
                  <option value="MOCK_EXAM">Mock exam (timed)</option>
                </select>
              </FormField>
              {quizType === 'MOCK_EXAM' && (
                <FormField label="Time limit (minutes)">
                  <Input
                    type="number"
                    min={5}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(e.target.value)}
                    placeholder="45"
                  />
                </FormField>
              )}
              <FormField label="Passing score (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={quizPassing}
                  onChange={(e) => setQuizPassing(e.target.value)}
                />
              </FormField>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={quizAllowBacktrack}
                  onChange={(e) => setQuizAllowBacktrack(e.target.checked)}
                  disabled={quizType === 'MOCK_EXAM'}
                />
                Allow going back to previous questions
              </label>
              <FormField label="Questions (published only)">
                {quizQuestionOptions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Publish questions in the Question bank tab first.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                    {quizQuestionOptions.map((q) => (
                      <label key={q.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q.id)}
                          onChange={(e) => {
                            setSelectedQuestionIds((ids) =>
                              e.target.checked
                                ? [...ids, q.id]
                                : ids.filter((id) => id !== q.id),
                            );
                          }}
                          className="mt-1"
                        />
                        <span className="line-clamp-2 text-slate-700">{q.stem}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FormField>
            </div>
            <div className="mt-4">
              <SubmitButton loading={createQuizMut.isPending}>
                {editingQuizId ? 'Save changes' : 'Save as draft'}
              </SubmitButton>
            </div>
          </form>

          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-semibold text-slate-900">Quizzes &amp; exams</h3>
              <p className="text-sm text-slate-500">{quizzes.length} quizzes</p>
            </div>
            {quizzesLoading ? (
              <p className="p-6 text-slate-500">Loading…</p>
            ) : quizzes.length === 0 ? (
              <p className="p-6 text-slate-500">No quizzes yet.</p>
            ) : (
              <ul className="divide-y">
                {quizzes.map((quiz) => (
                  <li key={quiz.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              quiz.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {quiz.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                          </span>
                          <span className="text-[10px] font-medium uppercase text-slate-400">
                            {formatQuizType(quiz.type)}
                          </span>
                        </div>
                        <p className="mt-2 font-medium text-slate-900">{quiz.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {quiz._count.questions} questions
                          {quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}
                          {` · Pass ${quiz.passingScore}%`}
                          {quiz._count.attempts > 0
                            ? ` · ${quiz._count.attempts} attempts`
                            : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 text-xs">
                        <button
                          type="button"
                          className="text-efundo-primary hover:underline"
                          onClick={() => loadQuizForEdit(quiz.id).catch((e: Error) => setError(e.message))}
                        >
                          Edit
                        </button>
                        {quiz.status === 'PUBLISHED' && (
                          <Link
                            href={`/practice/${quiz.id}`}
                            className="text-efundo-primary hover:underline"
                          >
                            Preview
                          </Link>
                        )}
                        {quiz.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="text-green-600 hover:underline"
                            onClick={async () => {
                              await publishQuiz(quiz.id, token!);
                              invalidate();
                            }}
                          >
                            Publish
                          </button>
                        )}
                        {quiz.status === 'PUBLISHED' && (
                          <button
                            type="button"
                            className="text-amber-600 hover:underline"
                            onClick={async () => {
                              await unpublishQuiz(quiz.id, token!);
                              invalidate();
                            }}
                          >
                            Unpublish
                          </button>
                        )}
                        {quiz._count.attempts === 0 && (
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={async () => {
                              if (!confirm('Delete this quiz?')) return;
                              await deleteQuiz(quiz.id, token!);
                              invalidate();
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
