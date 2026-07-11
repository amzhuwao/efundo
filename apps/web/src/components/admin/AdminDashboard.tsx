'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { AdminPageHeader } from '@/components/admin/AdminForms';
import { getPendingResources } from '@/lib/library';
import { getPrograms } from '@/lib/curriculum';
import { api } from '@/lib/api';
import type { PaginatedResponse, User } from '@efundo/shared-types';

const QUICK_ACTIONS = [
  {
    title: 'Lesson authoring',
    desc: 'Create modules, video lessons, and readings',
    href: '/admin/lessons',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER'],
  },
  {
    title: 'Assessment authoring',
    desc: 'Question bank, practice quizzes, mock exams',
    href: '/admin/assessment',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER'],
  },
  {
    title: 'Programs',
    desc: 'Add grades, forms, and courses by level',
    href: '/admin/curriculum',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  {
    title: 'Subjects',
    desc: 'Create, edit, and delete subjects',
    href: '/admin/subjects',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  {
    title: 'Moderation queue',
    desc: 'Approve or reject uploaded resources',
    href: '/admin/moderation',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'MODERATOR'],
  },
  {
    title: 'User management',
    desc: 'Assign roles and manage account status',
    href: '/admin/users',
    roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
  },
  {
    title: 'Browse library',
    desc: 'View published resources as students see them',
    href: '/library',
  },
];

export function AdminDashboard({ user }: { user: User }) {
  const token = useAuthStore((s) => s.accessToken());

  const { data: pending = [] } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: () => getPendingResources(token!),
    enabled: !!token,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['admin-programs-all'],
    queryFn: () => getPrograms(),
    enabled: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'].includes(user.role),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-count'],
    queryFn: () =>
      api.get<PaginatedResponse<{ id: string }>>('/users?limit=1', token!),
    enabled:
      !!token && ['SUPER_ADMIN', 'INSTITUTION_ADMIN'].includes(user.role),
  });

  const actions = QUICK_ACTIONS.filter(
    (a) => !a.roles || a.roles.includes(user.role),
  );

  const stats = [
    {
      label: 'Pending reviews',
      value: pending.length,
      href: '/admin/moderation',
      show: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'MODERATOR'].includes(
        user.role,
      ),
      highlight: pending.length > 0,
    },
    {
      label: 'Active programs',
      value: programs.length,
      href: '/admin/curriculum',
      show: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'].includes(user.role),
    },
    {
      label: 'Registered users',
      value: usersData?.total ?? '—',
      href: '/admin/users',
      show: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'].includes(user.role),
    },
  ].filter((s) => s.show);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${user.fullName.split(' ')[0]}. Manage curriculum, users, and content from here.`}
      />

      {stats.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className={`rounded-xl border bg-white p-5 shadow-sm transition hover:border-efundo-primary/30 hover:shadow-md ${
                stat.highlight ? 'border-amber-300 bg-amber-50/50' : ''
              }`}
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p
                className={`mt-1 text-3xl font-bold ${
                  stat.highlight ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {stat.value}
              </p>
            </Link>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border bg-white p-5 shadow-sm transition hover:border-efundo-primary/40 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-efundo-primary">
                {action.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{action.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Your access</h2>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as{' '}
          <span className="font-medium text-slate-800">{user.email}</span> with{' '}
          <span className="font-medium text-slate-800">
            {user.role.replace(/_/g, ' ').toLowerCase()}
          </span>{' '}
          permissions. Use the sidebar to navigate between admin sections.
        </p>
      </section>
    </div>
  );
}
