'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useUsersAdminGuard,
  AdminPageHeader,
  FormField,
  Input,
  Select,
  SubmitButton,
  ErrorAlert,
  SuccessAlert,
} from '@/components/admin/AdminForms';
import { useAuthStore } from '@/lib/auth-store';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type AdminUserRow,
} from '@/lib/users';

const ROLES = [
  'STUDENT',
  'LECTURER',
  'MODERATOR',
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
] as const;

const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;

const emptyForm = {
  email: '',
  fullName: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
};

export default function AdminUsersPage() {
  const user = useUsersAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => listUsers(token!, { limit: 100, search: search || undefined }),
    enabled: !!user && !!token,
  });

  const roleOptions = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return ROLES;
    return ROLES.filter((r) => r !== 'SUPER_ADMIN');
  }, [user?.role]);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startCreate() {
    resetForm();
    setError('');
    setSuccess('');
  }

  function startEdit(row: AdminUserRow) {
    setEditing(row);
    setForm({
      email: row.email,
      fullName: row.fullName,
      password: '',
      role: String(row.role),
      status: String(row.status),
    });
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editing) {
        const payload: {
          email: string;
          fullName: string;
          role: string;
          status: string;
          password?: string;
        } = {
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          role: form.role,
          status: form.status,
        };
        if (form.password) payload.password = form.password;
        await updateUser(editing.id, payload, token);
        setSuccess('User updated');
      } else {
        if (form.password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        await createUser(
          {
            email: form.email.trim(),
            fullName: form.fullName.trim(),
            password: form.password,
            role: form.role,
            status: form.status,
          },
          token,
        );
        setSuccess('User created');
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickUpdate(
    id: string,
    patch: { role?: string; status?: string },
  ) {
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await updateUser(id, patch, token);
      setSuccess('User updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  }

  async function handleDelete(row: AdminUserRow) {
    if (!token) return;
    if (
      !confirm(
        `Delete "${row.fullName}" (${row.email})? Their personal data will be removed.`,
      )
    ) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await deleteUser(row.id, token);
      setSuccess('User deleted');
      if (editing?.id === row.id) resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Create, update, and remove accounts. Manage roles and access status."
        backHref="/admin"
      />

      {(error || success) && (
        <div className="mb-4 space-y-2">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-1"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">
              {editing ? 'Edit user' : 'Create user'}
            </h2>
            {editing && (
              <button
                type="button"
                onClick={startCreate}
                className="text-xs text-efundo-primary hover:underline"
              >
                New user
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <FormField label="Full name">
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </FormField>
            <FormField
              label={editing ? 'New password (optional)' : 'Password'}
            >
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editing}
                minLength={editing ? undefined : 8}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                disabled={editing?.id === user.id}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                disabled={editing?.id === user.id}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <SubmitButton loading={loading}>
              {editing ? 'Save changes' : 'Create user'}
            </SubmitButton>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-4 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="mb-4 flex gap-2"
          >
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email"
            />
            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </form>

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
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b last:border-0 ${
                        editing?.id === u.id ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">{u.fullName}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={u.id === user.id}
                          onChange={(e) =>
                            handleQuickUpdate(u.id, { role: e.target.value })
                          }
                          className="rounded border px-2 py-1 text-xs"
                        >
                          {roleOptions.map((r) => (
                            <option key={r} value={r}>
                              {r.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.status}
                          disabled={u.id === user.id}
                          onChange={(e) =>
                            handleQuickUpdate(u.id, { status: e.target.value })
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
                          ? `${u.program.name}${
                              u.program.providerName
                                ? ` (${u.program.providerName})`
                                : ''
                            }`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="mr-2 text-xs font-medium text-efundo-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={u.id === user.id}
                          onClick={() => handleDelete(u)}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.data.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="border-t px-4 py-3 text-xs text-slate-400">
                {data?.total ?? 0} users total
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
