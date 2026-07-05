'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getHomeHref } from '@/lib/roles';

export function useAuthorGuard() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (
      !['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER'].includes(user.role)
    ) {
      router.replace(getHomeHref(user.role));
    }
  }, [user, router]);

  return user;
}

export function useAdminGuard() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (
      !['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'MODERATOR'].includes(user.role)
    ) {
      router.replace(getHomeHref(user.role));
    }
  }, [user, router]);

  return user;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary ${props.className ?? ''}`}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-efundo-primary focus:outline-none ${props.className ?? ''}`}
    >
      {children}
    </select>
  );
}

export function AdminPageHeader({
  title,
  description,
  backHref,
}: {
  title: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <div className="mb-8">
      {backHref && (
        <Link href={backHref} className="text-sm text-efundo-primary hover:underline">
          ← Back
        </Link>
      )}
      <h1 className={`text-3xl font-bold text-slate-900 ${backHref ? 'mt-2' : ''}`}>
        {title}
      </h1>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  type = 'submit',
  disabled,
  onClick,
}: {
  loading?: boolean;
  children: React.ReactNode;
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark disabled:opacity-50"
    >
      {loading ? 'Saving...' : children}
    </button>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
  );
}
