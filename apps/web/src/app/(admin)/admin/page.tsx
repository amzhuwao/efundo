'use client';

import { useAdminGuard } from '@/components/admin/AdminForms';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const user = useAdminGuard();
  if (!user) return null;
  return <AdminDashboard user={user} />;
}
