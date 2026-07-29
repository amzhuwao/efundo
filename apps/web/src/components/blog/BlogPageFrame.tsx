'use client';

import { useAuthStore } from '@/lib/auth-store';

/** Spacing adapts to AppShell (logged in) vs marketing chrome (guest). */
export function BlogPageFrame({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <div className={narrow ? 'max-w-3xl' : undefined}>{children}</div>;
  }

  return (
    <div
      className={`mx-auto px-4 py-16 ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}
    >
      {children}
    </div>
  );
}
