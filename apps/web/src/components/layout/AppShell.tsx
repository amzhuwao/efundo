'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace('/login');
  }, [user, hasHydrated, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!hasHydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading...
      </div>
    );
  }

  const isWide =
    pathname.startsWith('/learn/lessons/') ||
    pathname.startsWith('/admin/lessons/');

  return (
    <div className="min-h-screen bg-slate-100">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">
        <AppSidebar />
      </div>

      <div className="flex min-h-screen flex-col md:pl-64">
        <AppHeader onMenuOpen={() => setMobileOpen(true)} />

        <main className={isWide ? 'flex-1' : 'flex-1 p-4 md:p-8'}>
          <div className={isWide ? '' : 'mx-auto max-w-6xl'}>{children}</div>
        </main>
      </div>
    </div>
  );
}
