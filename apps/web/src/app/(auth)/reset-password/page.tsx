'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('This reset link is missing or invalid.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        password,
      });
      setMessage(res.message);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        This reset link is missing or invalid.{' '}
        <Link href="/forgot-password" className="font-medium underline">
          Request a new one
        </Link>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700">New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Confirm password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !!message}
        className="w-full rounded-lg bg-efundo-primary py-2.5 font-medium text-white hover:bg-efundo-primary-dark disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <Link href="/" className="text-2xl font-bold text-efundo-primary">
          eFundo
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter a new password for your account.
        </p>
        <Suspense
          fallback={<p className="mt-8 text-sm text-slate-500">Loading...</p>}
        >
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-efundo-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
