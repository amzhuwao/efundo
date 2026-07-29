import type {
  EducationLevel,
  PaginatedResponse,
  User,
  UserRole,
  UserStatus,
} from '@efundo/shared-types';
import { api } from './api';

export interface ProfileSubject {
  subjectId: string;
  subject: { id: string; name: string; code: string; year?: number | null };
}

export interface UserProfile extends User {
  emailVerified?: boolean;
  updatedAt?: string;
  program?: {
    id: string;
    name: string;
    providerName?: string | null;
    level: EducationLevel;
  } | null;
  favouriteSubjects?: ProfileSubject[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | string;
  status: UserStatus | string;
  avatarUrl?: string | null;
  educationLevel?: EducationLevel | string | null;
  programId?: string | null;
  year?: number | null;
  program?: {
    name: string;
    providerName?: string | null;
    level?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  avatarUrl?: string;
  educationLevel?: EducationLevel;
  programId?: string | null;
  year?: number | null;
  subjectIds?: string[];
}

export interface AdminUserPayload {
  email?: string;
  fullName?: string;
  password?: string;
  role?: string;
  status?: string;
  avatarUrl?: string | null;
  educationLevel?: string | null;
  programId?: string | null;
  year?: number | null;
}

export function getMyProfile(token: string) {
  return api.get<UserProfile>('/users/me', token);
}

export function updateMyProfile(payload: UpdateProfilePayload, token: string) {
  return api.patch<UserProfile>('/users/me', payload, token);
}

export function changeMyPassword(
  currentPassword: string,
  newPassword: string,
  token: string,
) {
  return api.patch<{ message: string }>(
    '/users/me/password',
    { currentPassword, newPassword },
    token,
  );
}

export function deleteMyAccount(token: string) {
  return api.delete<{ message: string }>('/users/me', token);
}

export function listUsers(
  token: string,
  params?: { page?: number; limit?: number; search?: string },
) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return api.get<PaginatedResponse<AdminUserRow>>(
    `/users${qs ? `?${qs}` : ''}`,
    token,
  );
}

export function getUser(id: string, token: string) {
  return api.get<UserProfile>(`/users/${id}`, token);
}

export function createUser(
  payload: AdminUserPayload & { email: string; password: string; fullName: string },
  token: string,
) {
  return api.post<AdminUserRow>('/users', payload, token);
}

export function updateUser(id: string, payload: AdminUserPayload, token: string) {
  return api.patch<AdminUserRow>(`/users/${id}`, payload, token);
}

export function deleteUser(id: string, token: string) {
  return api.delete<{ message: string }>(`/users/${id}`, token);
}
