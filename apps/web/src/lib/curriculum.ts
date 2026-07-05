import { api } from './api';
import type { EducationLevel, Program, Subject } from '@efundo/shared-types';

export function programUnitLabel(level: EducationLevel) {
  switch (level) {
    case 'PRIMARY':
      return 'Grade';
    case 'O_LEVEL':
    case 'A_LEVEL':
      return 'Form';
    default:
      return 'Program';
  }
}

export function usesFormOrGrade(level: EducationLevel) {
  return level === 'PRIMARY' || level === 'O_LEVEL' || level === 'A_LEVEL';
}

export function usesProvider(level: EducationLevel) {
  return level === 'TERTIARY' || level === 'OTHER';
}

export function getEducationLevels() {
  return api.get<Array<{ value: EducationLevel; label: string }>>(
    '/curriculum/levels',
  );
}

export function getPrograms(level?: EducationLevel, provider?: string) {
  const params = new URLSearchParams();
  if (level) params.set('level', level);
  if (provider) params.set('provider', provider);
  const qs = params.toString();
  return api.get<Program[]>(`/curriculum/programs${qs ? `?${qs}` : ''}`);
}

export function getProgram(id: string) {
  return api.get<Program>(`/curriculum/programs/${id}`);
}

export function getSubjects(programId: string, year?: number) {
  const qs = year ? `?year=${year}` : '';
  return api.get<Subject[]>(`/curriculum/programs/${programId}/subjects${qs}`);
}

export function updateProgram(
  id: string,
  data: Partial<Program>,
  token: string,
) {
  return api.patch<Program>(`/curriculum/programs/${id}`, data, token);
}

export function createProgram(
  data: {
    level: EducationLevel;
    name: string;
    slug: string;
    description?: string;
    providerName?: string;
    formOrGrade?: number;
    durationYears?: number;
    orderIndex?: number;
  },
  token: string,
) {
  return api.post<Program>('/curriculum/programs', data, token);
}

export function archiveProgram(id: string, token: string) {
  return api.delete(`/curriculum/programs/${id}`, token);
}

export function updateSubject(
  id: string,
  data: Partial<Subject>,
  token: string,
) {
  return api.patch<Subject>(`/curriculum/subjects/${id}`, data, token);
}

export function deleteSubject(id: string, token: string) {
  return api.delete(`/curriculum/subjects/${id}`, token);
}

export function createSubject(
  programId: string,
  data: {
    name: string;
    code: string;
    year?: number;
    semester?: number;
  },
  token: string,
) {
  return api.post<Subject>(`/curriculum/programs/${programId}/subjects`, data, token);
}

export async function getSubjectsForLearn(
  programId?: string | null,
  level?: EducationLevel | null,
) {
  if (programId) {
    return getSubjects(programId);
  }

  const programs = await getPrograms(level ?? 'TERTIARY');
  const preferred =
    programs.find((p) => p.slug === 'uz-bsc-computer-science') ?? programs[0];
  if (!preferred) return [];
  if (preferred.subjects?.length) return preferred.subjects;
  return getSubjects(preferred.id);
}
