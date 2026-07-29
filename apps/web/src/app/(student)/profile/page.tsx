'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EDUCATION_LEVEL_LABELS,
  type EducationLevel,
  type User,
} from '@efundo/shared-types';
import { useAuthStore } from '@/lib/auth-store';
import { getPrograms, getSubjects } from '@/lib/curriculum';
import {
  changeMyPassword,
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from '@/lib/users';
import {
  ErrorAlert,
  FormField,
  Input,
  Select,
  SubmitButton,
  SuccessAlert,
} from '@/components/admin/AdminForms';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, tokens, setAuth, logout, accessToken } = useAuthStore();
  const token = accessToken();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
  const [programId, setProgramId] = useState('');
  const [year, setYear] = useState('');
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => getMyProfile(token!),
    enabled: !!user && !!token,
  });

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? '');
    setAvatarUrl(profile.avatarUrl ?? '');
    setEducationLevel((profile.educationLevel as EducationLevel) ?? '');
    setProgramId(profile.programId ?? '');
    setYear(profile.year != null ? String(profile.year) : '');
    setSubjectIds(
      (profile.favouriteSubjects ?? []).map((s) => s.subjectId ?? s.subject.id),
    );
  }, [profile]);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs', educationLevel],
    queryFn: () => getPrograms(educationLevel as EducationLevel),
    enabled: !!educationLevel,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', programId, year],
    queryFn: () => getSubjects(programId, year ? Number(year) : undefined),
    enabled: !!programId,
  });

  function syncAuthUser(next: Partial<User>) {
    if (!user || !tokens) return;
    setAuth({ ...user, ...next }, tokens);
  }

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateMyProfile(
        {
          fullName: fullName.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          educationLevel: educationLevel || undefined,
          programId: programId || null,
          year: year ? Number(year) : null,
          subjectIds,
        },
        token,
      );
      syncAuthUser({
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
        educationLevel: updated.educationLevel,
        programId: updated.programId,
        year: updated.year,
      });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setSuccess('Profile saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    setError('');
    setSuccess('');
    try {
      await changeMyPassword(currentPassword, newPassword, token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!token) return;
    const confirmed = window.prompt(
      'Type DELETE to permanently remove your account and personal data:',
    );
    if (confirmed !== 'DELETE') return;
    setDeleting(true);
    setError('');
    try {
      await deleteMyAccount(token);
      logout();
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  }

  if (!user) return null;

  const levels = Object.entries(EDUCATION_LEVEL_LABELS) as [
    EducationLevel,
    string,
  ][];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-2 text-slate-600">
          Manage your account details, learning preferences, and security.
        </p>
      </div>

      {(error || success) && (
        <div className="mb-4 space-y-2">
          {error && <ErrorAlert message={error} />}
          {success && <SuccessAlert message={success} />}
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading profile...</p>
      ) : (
        <div className="space-y-8">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-900">Account details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Full name">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Email">
                <Input value={profile?.email ?? user.email} disabled />
              </FormField>
              <FormField label="Avatar URL">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
              <FormField label="Role">
                <Input
                  value={(profile?.role ?? user.role).replace(/_/g, ' ')}
                  disabled
                />
              </FormField>
            </div>

            <h3 className="mt-8 font-semibold text-slate-900">Learning profile</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Education level">
                <Select
                  value={educationLevel}
                  onChange={(e) => {
                    setEducationLevel(e.target.value as EducationLevel | '');
                    setProgramId('');
                    setSubjectIds([]);
                  }}
                >
                  <option value="">Select level</option>
                  {levels.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Program / class">
                <Select
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value);
                    setSubjectIds([]);
                  }}
                  disabled={!educationLevel}
                >
                  <option value="">Select program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                      {program.providerName ? ` (${program.providerName})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>
              {educationLevel === 'TERTIARY' && (
                <FormField label="Year of study">
                  <Select
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setSubjectIds([]);
                    }}
                  >
                    <option value="">Select year</option>
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
            </div>

            {programId && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700">
                  Favourite subjects
                </p>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-slate-500">No subjects found.</p>
                  ) : (
                    subjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex cursor-pointer items-center gap-3 text-sm"
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
              </div>
            )}

            <div className="mt-6">
              <SubmitButton loading={savingProfile}>Save profile</SubmitButton>
            </div>
          </form>

          <form
            onSubmit={handleChangePassword}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="font-semibold text-slate-900">Change password</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-1">
              <FormField label="Current password">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </FormField>
              <FormField label="New password">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirm new password">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </FormField>
            </div>
            <div className="mt-6">
              <SubmitButton loading={savingPassword}>Update password</SubmitButton>
            </div>
          </form>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800">Delete account</h2>
            <p className="mt-2 text-sm text-red-700">
              Permanently deletes your account, progress, bookmarks, and forum
              activity. This cannot be undone.
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete my account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
