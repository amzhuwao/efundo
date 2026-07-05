'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
} from '@efundo/shared-types';
import { getPrograms, getSubjects } from '@/lib/curriculum';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, accessToken, setAuth } = useAuthStore();
  const token = accessToken();

  const [step, setStep] = useState(1);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('TERTIARY');
  const [programId, setProgramId] = useState('');
  const [year, setYear] = useState(1);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', educationLevel],
    queryFn: () => getPrograms(educationLevel),
    enabled: !!educationLevel,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', programId, year],
    queryFn: () => getSubjects(programId, year),
    enabled: !!programId,
  });

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function finish() {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(
        '/users/me',
        { educationLevel, programId, year, subjectIds },
        token,
      );
      if (user) {
        setAuth(
          { ...user, educationLevel, programId, year },
          useAuthStore.getState().tokens!,
        );
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const levels = Object.entries(EDUCATION_LEVEL_LABELS) as [
    EducationLevel,
    string,
  ][];

  return (
    <div className="py-4">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">Set up your profile</h1>
        <p className="mt-1 text-slate-600">
          Step {step} of 3 — personalize your learning experience
        </p>

        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step ? 'bg-efundo-primary' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="font-semibold">Select your education level</h2>
              <div className="mt-4 space-y-2">
                {levels.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setEducationLevel(value);
                      setProgramId('');
                      setSubjectIds([]);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                      educationLevel === value
                        ? 'border-efundo-primary bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="mt-6 w-full rounded-lg bg-efundo-primary py-2.5 text-white"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold">Select your class / program</h2>
              <p className="mt-1 text-sm text-slate-500">
                {EDUCATION_LEVEL_LABELS[educationLevel]}
              </p>
              <div className="mt-4 space-y-2">
                {programs.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => {
                      setProgramId(program.id);
                      setSubjectIds([]);
                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                      programId === program.id
                        ? 'border-efundo-primary bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium">{program.name}</span>
                    {program.providerName && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {program.providerName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {educationLevel === 'TERTIARY' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium">
                    Year of study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => {
                      setYear(Number(e.target.value));
                      setSubjectIds([]);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border py-2.5 text-sm"
                >
                  Back
                </button>
                <button
                  disabled={!programId}
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg bg-efundo-primary py-2.5 text-white disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold">Choose your subjects</h2>
              <div className="mt-4 space-y-2">
                {subjects.length === 0 ? (
                  <p className="text-sm text-slate-500">No subjects found.</p>
                ) : (
                  subjects.map((subject) => (
                    <label
                      key={subject.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                        subjectIds.includes(subject.id)
                          ? 'border-efundo-primary bg-blue-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={subjectIds.includes(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        className="rounded"
                      />
                      <span>
                        {subject.name}{' '}
                        <span className="text-slate-400">({subject.code})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-lg border py-2.5 text-sm"
                >
                  Back
                </button>
                <button
                  disabled={saving}
                  onClick={finish}
                  className="flex-1 rounded-lg bg-efundo-primary py-2.5 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Finish setup'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
