'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

/** Ensures persisted auth is loaded before protected pages render. */
export function AuthHydration({ children }: { children: React.ReactNode }) {
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated);

  useEffect(() => {
    const markReady = () => setHasHydrated(true);

    if (useAuthStore.persist.hasHydrated()) {
      markReady();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(markReady);
    return unsub;
  }, [setHasHydrated]);

  return <>{children}</>;
}
