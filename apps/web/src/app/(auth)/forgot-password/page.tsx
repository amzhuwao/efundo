'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BrandLogo } from '@/components/brand/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', {
        email,
      });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <BrandLogo href="/" size="lg" priority />
        <h1 className="mt-6 text-2xl font-semibold">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your email and we&apos;ll send a reset link if an account exists.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full rounded-lg bg-efundo-primary py-2.5 font-medium text-white hover:bg-efundo-primary-dark disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-efundo-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
