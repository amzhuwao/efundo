'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { EDUCATION_LEVEL_LABELS, type EducationLevel } from '@efundo/shared-types';
import {
  getCatalog,
  getModules,
  getProgressSummary,
  formatDifficulty,
  type ModuleWithTopics,
} from '@/lib/lms';

const LEVELS: EducationLevel[] = [
  'PRIMARY',
  'O_LEVEL',
  'A_LEVEL',
  'TERTIARY',
  'OTHER',
];

export default function LearnPage() {
  const router = useRouter();
  const { user, accessToken, hasHydrated } = useAuthStore();
  const token = accessToken();

  const [level, setLevel] = useState<EducationLevel>('TERTIARY');
  const [programId, setProgramId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['lms-catalog'],
    queryFn: getCatalog,
    enabled: hasHydrated && !!user,
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['lms-modules', subjectId],
    queryFn: () => getModules(subjectId, token),
    enabled: !!subjectId,
  });

  const { data: progress } = useQuery({
    queryKey: ['lms-progress'],
    queryFn: () => getProgressSummary(token!),
    enabled: !!token,
    retry: false,
  });

  const levelEntry = useMemo(
    () => catalog.find((e) => e.level === level),
    [catalog, level],
  );

  const programs = levelEntry?.programs ?? [];

  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === programId),
    [programs, programId],
  );

  const subjects = selectedProgram?.subjects ?? [];

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login');
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (user?.educationLevel) setLevel(user.educationLevel);
  }, [user?.educationLevel]);

  useEffect(() => {
    if (!programs.length) return;
    const stillValid = programs.some((p) => p.id === programId);
    if (!stillValid) {
      const preferred =
        programs.find((p) => p.slug === 'uz-bsc-computer-science') ??
        programs.find((p) => p.subjects.some((s) => s.lessonCount > 0)) ??
        programs[0];
      setProgramId(preferred.id);
      setSubjectId('');
    }
  }, [programs, programId]);

  useEffect(() => {
    if (!subjects.length) return;
    const stillValid = subjects.some((s) => s.id === subjectId);
    if (!stillValid) {
      const withLessons = subjects.filter((s) => s.lessonCount > 0);
      const preferred =
        withLessons.find((s) => s.code === 'CS301') ??
        withLessons[0] ??
        subjects[0];
      setSubjectId(preferred.id);
    }
  }, [subjects, subjectId]);

  if (!hasHydrated || !user) {
    return (
      <div className="py-12 text-center text-slate-500">Loading...</div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lessons</h1>
          <p className="mt-1 text-slate-600">
            Browse learning classes by education level
          </p>
        </div>
        <Link
          href="/forum"
          className="text-sm font-medium text-efundo-primary hover:underline"
        >
          Study forum →
        </Link>
      </div>

      {!user.programId && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Browse all levels below, or{' '}
            <Link href="/onboarding" className="font-medium underline">
              complete onboarding
            </Link>{' '}
            to personalize your dashboard.
          </p>
        </div>
      )}

      {progress && (
        <div className="mt-6 grid gap-4 rounded-xl border bg-white p-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-efundo-primary">
              {progress.completed}
            </p>
            <p className="text-sm text-slate-500">Lessons completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700">
              {progress.inProgress}
            </p>
            <p className="text-sm text-slate-500">In progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-700">
              {progress.totalPublished}
            </p>
            <p className="text-sm text-slate-500">Available lessons</p>
          </div>
        </div>
      )}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Browse learning classes
        </h2>

        {catalogLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading catalog...</p>
        ) : (
          <>
            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700">
                Education level
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setLevel(l);
                      setProgramId('');
                      setSubjectId('');
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      level === l
                        ? 'bg-efundo-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {EDUCATION_LEVEL_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700">
                Class / program
              </label>
              {programs.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No programs for this level yet.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {programs.map((program) => (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => {
                        setProgramId(program.id);
                        setSubjectId('');
                      }}
                      className={`rounded-xl border p-4 text-left transition ${
                        programId === program.id
                          ? 'border-efundo-primary bg-efundo-primary/5 ring-1 ring-efundo-primary/30'
                          : 'hover:border-efundo-primary/40 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">
                        {program.name}
                      </p>
                      {program.providerName && (
                        <p className="mt-1 text-xs text-slate-500">
                          {program.providerName}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-400">
                        {program.subjects.filter((s) => s.lessonCount > 0).length}{' '}
                        subjects with lessons
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {programId && subjects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-700">Subjects</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map((subject) => {
                    const selected = subject.id === subjectId;
                    const hasLessons = subject.lessonCount > 0;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => setSubjectId(subject.id)}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? 'border-efundo-primary bg-efundo-primary/5'
                            : 'hover:border-efundo-primary/40'
                        } ${!hasLessons ? 'opacity-70' : ''}`}
                      >
                        <p className="text-xs font-medium text-efundo-primary">
                          {subject.code}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {subject.name}
                        </p>
                        <p
                          className={`mt-2 text-xs font-medium ${
                            hasLessons ? 'text-green-700' : 'text-slate-400'
                          }`}
                        >
                          {hasLessons
                            ? `${subject.lessonCount} lesson${subject.lessonCount === 1 ? '' : 's'}`
                            : 'Coming soon'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {subjectId && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            {subjects.find((s) => s.id === subjectId)?.code} lessons
          </h2>
          {modulesLoading ? (
            <p className="mt-6 text-center text-slate-500">Loading lessons...</p>
          ) : modules.length === 0 ? (
            <p className="mt-6 text-center text-slate-500">
              No lessons published for this subject yet.
            </p>
          ) : (
            <div className="mt-6 space-y-8">
              {modules.map((mod) => (
                <ModuleSection key={mod.id} module={mod} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ModuleSection({ module }: { module: ModuleWithTopics }) {
  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{module.title}</h2>
      {module.description && (
        <p className="mt-1 text-sm text-slate-600">{module.description}</p>
      )}
      <div className="mt-6 space-y-6">
        {module.topics.map((topic) => (
          <div key={topic.id}>
            <h3 className="font-medium text-slate-800">{topic.title}</h3>
            <ul className="mt-3 space-y-2">
              {topic.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={`/learn/lessons/${lesson.id}`}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition hover:border-efundo-primary/40 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      {(lesson.videoUrl || lesson.videoKey) && (
                        <span className="text-efundo-primary" title="Video lesson">
                          ▶
                        </span>
                      )}
                      {lesson.title}
                    </span>
                    <span className="flex items-center gap-3 text-slate-500">
                      <span>{lesson.durationMinutes} min</span>
                      <span>{formatDifficulty(lesson.difficulty)}</span>
                      {lesson.progress?.completed && (
                        <span className="text-green-600">✓ Done</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
