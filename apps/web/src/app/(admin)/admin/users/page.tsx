'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useAdminGuard, AdminPageHeader } from '@/components/admin/AdminForms';
import type { PaginatedResponse } from '@efundo/shared-types';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  program?: { name: string; providerName?: string | null; level?: string } | null;
  createdAt: string;
}

const ROLES = [
  'STUDENT',
  'LECTURER',
  'MODERATOR',
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
];

const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'];

export default function AdminUsersPage() {
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<PaginatedResponse<AdminUser>>('/users?limit=100', token),
    enabled: !!user && !!token,
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      role,
      status,
    }: {
      id: string;
      role?: string;
      status?: string;
    }) =>
      api.patch(`/users/${id}`, { ...(role && { role }), ...(status && { status }) }, token!),
    onSuccess: () => {
      setMessage('User updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setMessage(''), 3000);
    },
  });

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Manage accounts, roles, and access"
        backHref="/admin"
      />

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Program</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{u.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={u.id === user.id}
                      onChange={(e) =>
                        updateMut.mutate({ id: u.id, role: e.target.value })
                      }
                      className="rounded border px-2 py-1 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.status}
                      disabled={u.id === user.id}
                      onChange={(e) =>
                        updateMut.mutate({ id: u.id, status: e.target.value })
                      }
                      className="rounded border px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.program
                      ? `${u.program.name}${u.program.providerName ? ` (${u.program.providerName})` : ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t px-4 py-3 text-xs text-slate-400">
            {data?.total ?? 0} users total
          </p>
        </div>
      )}
    </div>
  );
}
