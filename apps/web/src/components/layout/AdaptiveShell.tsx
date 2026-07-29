'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AppShell } from './AppShell';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { CookieConsent } from '@/components/CookieConsent';
import { AdSenseScript } from '@/components/AdSenseScript';

/**
 * Public routes that should feel like the platform when logged in,
 * and like the marketing site when browsing as a guest.
 */
export function AdaptiveShell({ children }: { children: React.ReactNode }) {
  const { user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading...
      </div>
    );
  }

  if (user) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CookieConsent />
      <AdSenseScript />
    </div>
  );
}
