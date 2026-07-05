'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  getPendingResources,
  moderateResource,
  formatResourceType,
} from '@/lib/library';
import { useAdminGuard, AdminPageHeader } from '@/components/admin/AdminForms';

export default function ModerationPage() {
  const user = useAdminGuard();
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-resources'],
    queryFn: () => getPendingResources(token!),
    enabled: !!token,
  });

  const moderateMut = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'approve' | 'reject' | 'publish';
    }) => moderateResource(id, action, token!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['pending-resources'] }),
  });

  if (!user) return null;

  return (
    <div>
      <AdminPageHeader
        title="Moderation queue"
        description="Review uploaded resources before they go live"
        backHref="/admin"
      />

      {isLoading ? (
        <p className="mt-8 text-slate-500">Loading...</p>
      ) : pending.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-slate-500">
          No resources pending review.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {pending.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border bg-white p-6"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <span className="text-xs font-medium text-efundo-primary">
                    {formatResourceType(r.type)}
                  </span>
                  <h2 className="mt-1 text-lg font-semibold">{r.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {r.program?.providerName ?? r.program?.name} · Uploaded by {r.uploader?.fullName}
                  </p>
                  {r.description && (
                    <p className="mt-2 text-sm text-slate-600">{r.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() =>
                      moderateMut.mutate({ id: r.id, action: 'publish' })
                    }
                    disabled={moderateMut.isPending}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() =>
                      moderateMut.mutate({ id: r.id, action: 'reject' })
                    }
                    disabled={moderateMut.isPending}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
