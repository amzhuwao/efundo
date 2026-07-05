import type { AuthTokens } from '@efundo/shared-types';
import { useAuthStore } from './auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { tokens, user, setAuth, logout } = useAuthStore.getState();
  if (!tokens?.refreshToken || !user) {
    logout();
    return null;
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  const nextTokens = data.tokens as AuthTokens;
  setAuth(data.user ?? user, nextTokens);
  return nextTokens.accessToken;
}

async function getAccessToken(token?: string | null): Promise<string | null> {
  if (token) return token;
  return useAuthStore.getState().accessToken();
}

function parseErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return 'Request failed';
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  allowRefresh = true,
): Promise<T> {
  const accessToken = await getAccessToken(token);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && allowRefresh && accessToken && !path.startsWith('/auth/')) {
    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const newToken = await refreshInFlight;
    if (newToken) {
      return request<T>(path, options, newToken, false);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, parseErrorMessage(data));
  }

  return data as T;
}

/** Authenticated fetch for non-JSON requests (e.g. file uploads). */
export async function authFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  allowRefresh = true,
): Promise<Response> {
  const accessToken = await getAccessToken(token);
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && allowRefresh && accessToken && !path.startsWith('/auth/')) {
    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const newToken = await refreshInFlight;
    if (newToken) {
      return authFetch(path, options, newToken, false);
    }
  }

  return res;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE' }, token),
};

export { API_URL };
